use std::{
    collections::{HashMap, HashSet},
    future::Future,
    net::TcpListener,
    path::Path,
    process::{Command, Stdio},
    time::Duration,
};

use futures_util::{SinkExt, StreamExt, stream::FuturesUnordered};
use serde::Deserialize;
use serde_json::{Value, json};
use tokio::time::sleep;
use tokio_tungstenite::{connect_async, tungstenite::Message};

use crate::{codex::executable_from_install, error::StylerError};

const TARGET_POLL_INTERVAL: Duration = Duration::from_millis(200);
const TARGET_HTTP_TIMEOUT: Duration = Duration::from_millis(900);
const RENDERER_READY_TIMEOUT: Duration = Duration::from_millis(750);
const READY_TARGET_STABLE_SAMPLES: usize = 3;

#[cfg(target_os = "windows")]
use crate::codex::{is_windows_store_install, windows_store_app_user_model_ids};

#[cfg(target_os = "windows")]
fn launch_windows_packaged_app(
    app_user_model_id: &str,
    arguments: &str,
) -> Result<u32, StylerError> {
    use windows::{
        Win32::{
            System::Com::{
                CLSCTX_LOCAL_SERVER, COINIT_MULTITHREADED, CoCreateInstance, CoInitializeEx,
                CoUninitialize,
            },
            UI::Shell::{AO_NONE, ApplicationActivationManager, IApplicationActivationManager},
        },
        core::HSTRING,
    };

    unsafe {
        let initialized_here = match CoInitializeEx(None, COINIT_MULTITHREADED).ok() {
            Ok(()) => true,
            // Tauri may call from an existing STA thread. COM is already
            // available there; only the requested apartment model differs.
            Err(error) if error.code().0 == 0x80010106u32 as i32 => false,
            Err(error) => return Err(StylerError::Launch(error.to_string())),
        };
        let result = (|| {
            let manager: IApplicationActivationManager =
                CoCreateInstance(&ApplicationActivationManager, None, CLSCTX_LOCAL_SERVER)?;
            manager.ActivateApplication(
                &HSTRING::from(app_user_model_id),
                &HSTRING::from(arguments),
                AO_NONE,
            )
        })();
        if initialized_here {
            CoUninitialize();
        }
        result.map_err(|error| StylerError::Launch(error.to_string()))
    }
}

fn launch_codex_process(executable: &Path, port: u16) -> Result<u32, StylerError> {
    let port_argument = format!("--remote-debugging-port={port}");
    let address_argument = "--remote-debugging-address=127.0.0.1";

    #[cfg(target_os = "windows")]
    if is_windows_store_install(executable) {
        let app_user_model_ids = windows_store_app_user_model_ids(executable);
        if app_user_model_ids.is_empty() {
            return Err(StylerError::Launch(
                "The Microsoft Store installation could not be resolved to an application identity"
                    .into(),
            ));
        }
        let arguments = format!("{port_argument} {address_argument}");
        let mut last_error = None;
        for app_user_model_id in app_user_model_ids {
            match launch_windows_packaged_app(&app_user_model_id, &arguments) {
                Ok(process_id) => return Ok(process_id),
                Err(error) => last_error = Some(error),
            }
        }
        return Err(last_error.unwrap_or_else(|| {
            StylerError::Launch(
                "Windows could not activate the Microsoft Store Codex package".into(),
            )
        }));
    }

    Command::new(executable)
        .arg(port_argument)
        .arg(address_argument)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map(|child| child.id())
        .map_err(|error| StylerError::Launch(error.to_string()))
}

#[derive(Debug)]
pub struct CdpSession {
    pub port: u16,
    pub websocket_url: String,
    pub child_id: u32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CdpTarget {
    #[serde(rename = "type")]
    target_type: String,
    title: String,
    url: String,
    web_socket_debugger_url: Option<String>,
}

#[derive(Debug, Clone, Copy)]
struct TargetWaitPolicy {
    attempts: usize,
    poll_interval: Duration,
    candidate_timeout: Duration,
    overall_timeout: Duration,
}

impl TargetWaitPolicy {
    fn production(attempts: usize) -> Self {
        Self {
            attempts,
            poll_interval: TARGET_POLL_INTERVAL,
            candidate_timeout: RENDERER_READY_TIMEOUT,
            // Preserve the existing polling budget while placing a hard bound
            // around HTTP, websocket, and renderer work performed inside it.
            overall_timeout: TARGET_POLL_INTERVAL
                .saturating_mul(attempts as u32)
                .saturating_add(Duration::from_secs(2)),
        }
    }
}

#[derive(Debug, Default)]
struct ReadyTargetTracker {
    streaks: HashMap<String, usize>,
}

impl ReadyTargetTracker {
    fn observe(&mut self, ready_websockets: Vec<String>) -> Option<String> {
        let mut seen = HashSet::new();
        let ready_websockets = ready_websockets
            .into_iter()
            .filter(|websocket_url| seen.insert(websocket_url.clone()))
            .collect::<Vec<_>>();

        self.streaks
            .retain(|websocket_url, _| seen.contains(websocket_url));
        for websocket_url in ready_websockets {
            let samples = self.streaks.entry(websocket_url.clone()).or_default();
            *samples += 1;
            if *samples >= READY_TARGET_STABLE_SAMPLES {
                return Some(websocket_url);
            }
        }
        None
    }
}

pub async fn launch_and_connect(install_path: &str) -> Result<CdpSession, StylerError> {
    let port = reserve_loopback_port()?;
    let executable =
        executable_from_install(Path::new(install_path)).ok_or(StylerError::CodexNotFound)?;

    let child_id = launch_codex_process(&executable, port)?;
    let websocket_url = wait_for_ready_target(port, 60).await?;

    Ok(CdpSession {
        port,
        websocket_url,
        child_id,
    })
}

pub async fn wait_for_ready_target(port: u16, attempts: usize) -> Result<String, StylerError> {
    let client = reqwest::Client::builder()
        .timeout(TARGET_HTTP_TIMEOUT)
        .build()?;
    let endpoint = format!("http://127.0.0.1:{port}/json/list");

    wait_for_ready_target_with(
        port,
        TargetWaitPolicy::production(attempts),
        move || {
            let client = client.clone();
            let endpoint = endpoint.clone();
            async move {
                let response = client.get(endpoint).send().await.ok()?;
                response.json::<Vec<CdpTarget>>().await.ok()
            }
        },
        |websocket_url| async move { renderer_is_ready(&websocket_url).await },
    )
    .await
}

async fn wait_for_ready_target_with<FetchTargets, FetchFuture, CheckReady, CheckFuture>(
    port: u16,
    policy: TargetWaitPolicy,
    mut fetch_targets: FetchTargets,
    mut check_ready: CheckReady,
) -> Result<String, StylerError>
where
    FetchTargets: FnMut() -> FetchFuture,
    FetchFuture: Future<Output = Option<Vec<CdpTarget>>>,
    CheckReady: FnMut(String) -> CheckFuture,
    CheckFuture: Future<Output = bool>,
{
    let wait = async {
        let mut tracker = ReadyTargetTracker::default();
        for attempt in 0..policy.attempts {
            let ready_websockets = if let Some(targets) = fetch_targets().await {
                ready_websockets(targets, port, policy.candidate_timeout, &mut check_ready).await
            } else {
                Vec::new()
            };

            // Electron can expose trusted auxiliary pages before the React
            // workspace is ready. Requiring the same ready websocket in three
            // consecutive polls prevents applying to a transient renderer.
            if let Some(websocket_url) = tracker.observe(ready_websockets) {
                return Ok(websocket_url);
            }

            if attempt + 1 < policy.attempts {
                sleep(policy.poll_interval).await;
            }
        }
        Err(StylerError::TargetTimeout)
    };

    tokio::time::timeout(policy.overall_timeout, wait)
        .await
        .unwrap_or(Err(StylerError::TargetTimeout))
}

async fn ready_websockets<CheckReady, CheckFuture>(
    targets: Vec<CdpTarget>,
    port: u16,
    candidate_timeout: Duration,
    check_ready: &mut CheckReady,
) -> Vec<String>
where
    CheckReady: FnMut(String) -> CheckFuture,
    CheckFuture: Future<Output = bool>,
{
    let mut checks = FuturesUnordered::new();
    for target in targets.into_iter().filter(is_trusted_codex_target) {
        let Some(websocket_url) = target.web_socket_debugger_url else {
            continue;
        };
        if !is_loopback_debugger_url(&websocket_url, port) {
            continue;
        }

        let check = check_ready(websocket_url.clone());
        checks.push(async move {
            let ready = tokio::time::timeout(candidate_timeout, check)
                .await
                .unwrap_or(false);
            (websocket_url, ready)
        });
    }

    let mut ready = Vec::new();
    while let Some((websocket_url, is_ready)) = checks.next().await {
        if is_ready {
            ready.push(websocket_url);
        }
    }
    ready
}

async fn renderer_is_ready(websocket_url: &str) -> bool {
    let expression = r#"(() => {
      const root = document.querySelector('#root') || document.body?.firstElementChild;
      const surface = document.querySelector(
        'main.main-surface, aside.app-shell-left-panel, .composer-surface-chrome, [data-testid="composer"], [role="main"]'
      );
      return document.readyState !== 'loading' && Boolean(root && surface);
    })()"#;
    tokio::time::timeout(RENDERER_READY_TIMEOUT, evaluate(websocket_url, expression))
        .await
        .ok()
        .and_then(Result::ok)
        .and_then(|response| {
            response
                .pointer("/result/result/value")
                .and_then(Value::as_bool)
        })
        == Some(true)
}

pub async fn evaluate(websocket_url: &str, expression: &str) -> Result<Value, StylerError> {
    let (mut socket, _) = connect_async(websocket_url).await?;
    let request = json!({
        "id": 1,
        "method": "Runtime.evaluate",
        "params": {
            "expression": expression,
            "awaitPromise": true,
            "returnByValue": true,
            "userGesture": false
        }
    });
    socket
        .send(Message::Text(request.to_string().into()))
        .await?;

    while let Some(message) = socket.next().await {
        let message = message?;
        if let Message::Text(text) = message {
            let response: Value = serde_json::from_str(text.as_ref())
                .map_err(|error| StylerError::Runtime(error.to_string()))?;
            if response.get("id").and_then(Value::as_u64) == Some(1) {
                let _ = socket.close(None).await;
                if let Some(exception) = response
                    .pointer("/result/exceptionDetails/text")
                    .and_then(Value::as_str)
                {
                    return Err(StylerError::Runtime(exception.into()));
                }
                return Ok(response);
            }
        }
    }

    Err(StylerError::Runtime(
        "The Codex debugging socket closed before replying".into(),
    ))
}

pub async fn probe(websocket_url: &str) -> Result<(), StylerError> {
    let result = tokio::time::timeout(Duration::from_millis(750), connect_async(websocket_url))
        .await
        .map_err(|_| StylerError::Runtime("The Codex debugging socket probe timed out".into()))?;
    let (mut socket, _) = result?;
    socket.close(None).await?;
    Ok(())
}

fn reserve_loopback_port() -> Result<u16, StylerError> {
    let listener = TcpListener::bind(("127.0.0.1", 0))?;
    Ok(listener.local_addr()?.port())
}

fn is_trusted_codex_target(target: &CdpTarget) -> bool {
    if target.target_type != "page" || target.web_socket_debugger_url.is_none() {
        return false;
    }
    let title = target.title.to_ascii_lowercase();
    let trusted_scheme = ["file://", "app://", "codex://", "http://localhost"]
        .iter()
        .any(|prefix| target.url.starts_with(prefix));
    trusted_scheme && (title.contains("codex") || !target.url.starts_with("http"))
}

fn is_loopback_debugger_url(url: &str, port: u16) -> bool {
    let expected = format!("ws://127.0.0.1:{port}/devtools/page/");
    url.starts_with(&expected)
}

#[cfg(test)]
mod tests {
    use std::time::{Duration, Instant};

    use super::{
        CdpTarget, TargetWaitPolicy, is_loopback_debugger_url, is_trusted_codex_target,
        ready_websockets, reserve_loopback_port, wait_for_ready_target_with,
    };

    const TEST_PORT: u16 = 43123;

    fn target(name: &str, url: &str) -> CdpTarget {
        CdpTarget {
            target_type: "page".into(),
            title: "Codex".into(),
            url: url.into(),
            web_socket_debugger_url: Some(format!(
                "ws://127.0.0.1:{TEST_PORT}/devtools/page/{name}"
            )),
        }
    }

    fn websocket(name: &str) -> String {
        format!("ws://127.0.0.1:{TEST_PORT}/devtools/page/{name}")
    }

    fn ready_names(targets: Vec<CdpTarget>) -> Vec<String> {
        tauri::async_runtime::block_on(async {
            let mut check_ready =
                |websocket_url: String| async move { websocket_url.ends_with("/workspace") };
            ready_websockets(
                targets,
                TEST_PORT,
                Duration::from_millis(20),
                &mut check_ready,
            )
            .await
        })
    }

    #[test]
    fn reserves_only_a_loopback_port() {
        assert!(reserve_loopback_port().unwrap() > 0);
    }

    #[test]
    fn rejects_browser_targets() {
        let target = CdpTarget {
            target_type: "page".into(),
            title: "Example".into(),
            url: "https://example.com".into(),
            web_socket_debugger_url: Some("ws://127.0.0.1:1/devtools/page/1".into()),
        };
        assert!(!is_trusted_codex_target(&target));
    }

    #[test]
    fn accepts_only_the_reserved_loopback_debugger() {
        assert!(is_loopback_debugger_url(
            "ws://127.0.0.1:43123/devtools/page/abc",
            43123
        ));
        assert!(!is_loopback_debugger_url(
            "ws://localhost:43123/devtools/page/abc",
            43123
        ));
        assert!(!is_loopback_debugger_url(
            "ws://127.0.0.1:43124/devtools/page/abc",
            43123
        ));
    }

    #[test]
    fn selects_ready_workspace_when_overlay_precedes_it() {
        let ready = ready_names(vec![
            target(
                "avatar-overlay",
                "app://-/index.html?initialRoute=%2Favatar-overlay",
            ),
            target("workspace", "app://-/index.html"),
        ]);

        assert_eq!(ready, vec![websocket("workspace")]);
    }

    #[test]
    fn selects_ready_workspace_when_it_precedes_overlay() {
        let ready = ready_names(vec![
            target("workspace", "app://-/index.html"),
            target(
                "avatar-overlay",
                "app://-/index.html?initialRoute=%2Favatar-overlay",
            ),
        ]);

        assert_eq!(ready, vec![websocket("workspace")]);
    }

    #[test]
    fn skips_multiple_unready_trusted_pages_before_workspace() {
        let ready = ready_names(vec![
            target("login", "app://-/index.html?initialRoute=%2Flogin"),
            target("upgrade", "app://-/index.html?initialRoute=%2Fupgrade"),
            target("settings", "app://-/index.html?initialRoute=%2Fsettings"),
            target("workspace", "app://-/index.html"),
        ]);

        assert_eq!(ready, vec![websocket("workspace")]);
    }

    #[test]
    fn timed_out_candidate_does_not_block_ready_workspace() {
        let ready = tauri::async_runtime::block_on(async {
            let mut check_ready = |websocket_url: String| async move {
                if websocket_url.ends_with("/avatar-overlay") {
                    tokio::time::sleep(Duration::from_millis(50)).await;
                }
                websocket_url.ends_with("/workspace")
            };
            ready_websockets(
                vec![
                    target(
                        "avatar-overlay",
                        "app://-/index.html?initialRoute=%2Favatar-overlay",
                    ),
                    target("workspace", "app://-/index.html"),
                ],
                TEST_PORT,
                Duration::from_millis(5),
                &mut check_ready,
            )
            .await
        });

        assert_eq!(ready, vec![websocket("workspace")]);
    }

    #[test]
    fn stable_workspace_survives_candidate_order_changes() {
        let result = tauri::async_runtime::block_on(async {
            let mut fetch_count = 0;
            wait_for_ready_target_with(
                TEST_PORT,
                TargetWaitPolicy {
                    attempts: 3,
                    poll_interval: Duration::from_millis(1),
                    candidate_timeout: Duration::from_millis(20),
                    overall_timeout: Duration::from_millis(100),
                },
                move || {
                    fetch_count += 1;
                    let targets = if fetch_count % 2 == 0 {
                        vec![
                            target("workspace", "app://-/index.html"),
                            target(
                                "avatar-overlay",
                                "app://-/index.html?initialRoute=%2Favatar-overlay",
                            ),
                        ]
                    } else {
                        vec![
                            target(
                                "avatar-overlay",
                                "app://-/index.html?initialRoute=%2Favatar-overlay",
                            ),
                            target("workspace", "app://-/index.html"),
                        ]
                    };
                    async move { Some(targets) }
                },
                |websocket_url| async move { websocket_url.ends_with("/workspace") },
            )
            .await
        });

        assert_eq!(result.unwrap(), websocket("workspace"));
    }

    #[test]
    fn unavailable_workspace_fails_within_overall_bound() {
        let started_at = Instant::now();
        let result = tauri::async_runtime::block_on(wait_for_ready_target_with(
            TEST_PORT,
            TargetWaitPolicy {
                attempts: 100,
                poll_interval: Duration::from_millis(100),
                candidate_timeout: Duration::from_secs(1),
                overall_timeout: Duration::from_millis(30),
            },
            || async {
                Some(vec![target(
                    "avatar-overlay",
                    "app://-/index.html?initialRoute=%2Favatar-overlay",
                )])
            },
            |_| async {
                tokio::time::sleep(Duration::from_secs(1)).await;
                false
            },
        ));

        assert!(matches!(
            result,
            Err(crate::error::StylerError::TargetTimeout)
        ));
        assert!(started_at.elapsed() < Duration::from_millis(250));
    }
}
