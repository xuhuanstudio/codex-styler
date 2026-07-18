use std::{
    net::TcpListener,
    path::Path,
    process::{Command, Stdio},
    time::Duration,
};

use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use serde_json::{Value, json};
use tokio::time::sleep;
use tokio_tungstenite::{connect_async, tungstenite::Message};

use crate::{codex::executable_from_install, error::StylerError};

#[cfg(target_os = "windows")]
use crate::codex::{is_windows_store_install, windows_store_app_user_model_id};

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
        CoInitializeEx(None, COINIT_MULTITHREADED)
            .ok()
            .map_err(|error| StylerError::Launch(error.to_string()))?;
        let result = (|| {
            let manager: IApplicationActivationManager =
                CoCreateInstance(&ApplicationActivationManager, None, CLSCTX_LOCAL_SERVER)?;
            manager.ActivateApplication(
                &HSTRING::from(app_user_model_id),
                &HSTRING::from(arguments),
                AO_NONE,
            )
        })();
        CoUninitialize();
        result.map_err(|error| StylerError::Launch(error.to_string()))
    }
}

fn launch_codex_process(executable: &Path, port: u16) -> Result<u32, StylerError> {
    let port_argument = format!("--remote-debugging-port={port}");
    let address_argument = "--remote-debugging-address=127.0.0.1";

    #[cfg(target_os = "windows")]
    if is_windows_store_install(executable) {
        let app_user_model_id = windows_store_app_user_model_id(executable).ok_or_else(|| {
            StylerError::Launch(
                "The Microsoft Store installation could not be resolved to an application identity"
                    .into(),
            )
        })?;
        return launch_windows_packaged_app(
            &app_user_model_id,
            &format!("{port_argument} {address_argument}"),
        );
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

pub async fn launch_and_connect(install_path: &str) -> Result<CdpSession, StylerError> {
    let port = reserve_loopback_port()?;
    let executable =
        executable_from_install(Path::new(install_path)).ok_or(StylerError::CodexNotFound)?;

    let child_id = launch_codex_process(&executable, port)?;

    let client = reqwest::Client::builder()
        .timeout(Duration::from_millis(900))
        .build()?;
    let endpoint = format!("http://127.0.0.1:{port}/json/list");

    for _ in 0..50 {
        if let Ok(response) = client.get(&endpoint).send().await
            && let Ok(targets) = response.json::<Vec<CdpTarget>>().await
            && let Some(target) = targets.into_iter().find(is_trusted_codex_target)
            && let Some(websocket_url) = target.web_socket_debugger_url
            && is_loopback_debugger_url(&websocket_url, port)
        {
            return Ok(CdpSession {
                port,
                websocket_url,
                child_id,
            });
        }
        sleep(Duration::from_millis(200)).await;
    }

    Err(StylerError::TargetTimeout)
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
    use super::{
        CdpTarget, is_loopback_debugger_url, is_trusted_codex_target, reserve_loopback_port,
    };

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
}
