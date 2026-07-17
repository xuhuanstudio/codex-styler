mod cdp;
mod codex;
mod error;
mod model;

use std::{fs, path::PathBuf, sync::Mutex};

use model::{AppRuntime, RuntimeStatus};
use semver::Version;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{
    AppHandle, Manager, State,
    ipc::Channel,
    ipc::{InvokeBody, Request, Response},
};
use tauri_plugin_updater::{Update, UpdaterExt};

const SUPPORTED_CODEX_VERSIONS: &[&str] = &["26.707.72221", "26.707.91948"];
const RELEASES_API: &str =
    "https://api.github.com/repos/xuhuanstudio/codex-styler/releases?per_page=20";

#[derive(Debug, Deserialize)]
struct GitHubRelease {
    tag_name: String,
    draft: bool,
    prerelease: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateMetadata {
    version: String,
    notes: Option<String>,
    published_at: Option<String>,
    prerelease: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateCheckResult {
    current_version: String,
    update: Option<UpdateMetadata>,
}

#[derive(Clone, Serialize)]
#[serde(tag = "event", content = "data")]
enum UpdateDownloadEvent {
    #[serde(rename_all = "camelCase")]
    Started {
        content_length: Option<u64>,
    },
    #[serde(rename_all = "camelCase")]
    Progress {
        chunk_length: usize,
    },
    Finished,
}

struct PendingUpdate(Mutex<Option<Update>>);

fn release_version(tag: &str) -> Option<Version> {
    Version::parse(tag.trim().trim_start_matches(['v', 'V'])).ok()
}

fn select_release(
    current: &Version,
    releases: impl IntoIterator<Item = GitHubRelease>,
) -> Option<GitHubRelease> {
    releases
        .into_iter()
        .filter(|release| !release.draft)
        .filter(|release| !current.pre.is_empty() || !release.prerelease)
        .filter_map(|release| {
            let version = release_version(&release.tag_name)?;
            (version > *current).then_some((version, release))
        })
        .max_by(|(left, _), (right, _)| left.cmp(right))
        .map(|(_, release)| release)
}

#[tauri::command]
async fn check_for_updates(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
) -> Result<UpdateCheckResult, String> {
    let current = Version::parse(env!("CARGO_PKG_VERSION")).map_err(|error| error.to_string())?;
    *pending_update
        .0
        .lock()
        .map_err(|_| "Update state is unavailable".to_string())? = None;
    let releases = reqwest::Client::new()
        .get(RELEASES_API)
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .header("User-Agent", "codex-styler-update-check")
        .send()
        .await
        .map_err(|error| format!("Could not reach GitHub Releases: {error}"))?
        .error_for_status()
        .map_err(|error| format!("GitHub Releases returned an error: {error}"))?
        .json::<Vec<GitHubRelease>>()
        .await
        .map_err(|error| format!("Could not read the GitHub release list: {error}"))?;
    let Some(release) = select_release(&current, releases) else {
        return Ok(UpdateCheckResult {
            current_version: current.to_string(),
            update: None,
        });
    };
    let endpoint = format!(
        "https://github.com/xuhuanstudio/codex-styler/releases/download/{}/latest.json",
        release.tag_name
    )
    .parse()
    .map_err(|error| format!("Invalid update endpoint: {error}"))?;
    let update = app
        .updater_builder()
        .endpoints(vec![endpoint])
        .map_err(|error| error.to_string())?
        .build()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| format!("Could not verify the update manifest: {error}"))?;
    let Some(update) = update else {
        return Ok(UpdateCheckResult {
            current_version: current.to_string(),
            update: None,
        });
    };
    let expected_version = release_version(&release.tag_name)
        .ok_or_else(|| "The selected GitHub release has an invalid version".to_string())?;
    let manifest_version = Version::parse(&update.version)
        .map_err(|error| format!("The update manifest has an invalid version: {error}"))?;
    if manifest_version != expected_version {
        return Err("The update manifest version does not match its GitHub release".into());
    }
    let metadata = UpdateMetadata {
        version: update.version.clone(),
        notes: update.body.clone(),
        published_at: update.date.map(|date| date.to_string()),
        prerelease: release.prerelease,
    };
    *pending_update
        .0
        .lock()
        .map_err(|_| "Update state is unavailable".to_string())? = Some(update);
    Ok(UpdateCheckResult {
        current_version: current.to_string(),
        update: Some(metadata),
    })
}

#[tauri::command]
async fn download_and_install_update(
    pending_update: State<'_, PendingUpdate>,
    on_event: Channel<UpdateDownloadEvent>,
) -> Result<(), String> {
    let update = pending_update
        .0
        .lock()
        .map_err(|_| "Update state is unavailable".to_string())?
        .take()
        .ok_or_else(|| "There is no verified update ready to install".to_string())?;
    let mut started = false;
    update
        .download_and_install(
            |chunk_length, content_length| {
                if !started {
                    let _ = on_event.send(UpdateDownloadEvent::Started { content_length });
                    started = true;
                }
                let _ = on_event.send(UpdateDownloadEvent::Progress { chunk_length });
            },
            || {
                let _ = on_event.send(UpdateDownloadEvent::Finished);
            },
        )
        .await
        .map_err(|error| format!("Could not download and install the update: {error}"))
}

#[tauri::command]
fn restart_app(app: AppHandle) {
    app.restart();
}

fn compatibility_for_version(version: Option<&str>) -> model::Compatibility {
    match version {
        Some(version) if SUPPORTED_CODEX_VERSIONS.contains(&version) => {
            model::Compatibility::Supported
        }
        _ => model::Compatibility::Safe,
    }
}

fn is_valid_compatibility_mode(mode: &str) -> bool {
    matches!(mode, "auto" | "compatibility" | "developer")
}

fn is_valid_theme_id(theme_id: &str) -> bool {
    let mut chars = theme_id.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    theme_id.len() <= 64
        && theme_id.len() >= 3
        && first.is_ascii_lowercase()
        && chars.all(|character| {
            character.is_ascii_lowercase()
                || character.is_ascii_digit()
                || matches!(character, '.' | '-')
        })
}

fn theme_archive_path(app: &AppHandle, theme_id: &str) -> Result<PathBuf, String> {
    if !is_valid_theme_id(theme_id) {
        return Err("Theme id is not safe for local storage".into());
    }
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("themes");
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    Ok(directory.join(format!("{theme_id}.codex-styler-theme")))
}

#[tauri::command]
fn save_theme_archive(app: AppHandle, request: Request<'_>) -> Result<(), String> {
    let theme_id = request
        .headers()
        .get("x-codex-styler-theme-id")
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| "Theme archive request is missing a valid theme id".to_string())?;
    let archive = match request.body() {
        InvokeBody::Raw(bytes) => bytes,
        InvokeBody::Json(_) => return Err("Theme archive request must contain raw bytes".into()),
    };
    let path = theme_archive_path(&app, theme_id)?;
    fs::write(path, archive).map_err(|error| error.to_string())
}

#[tauri::command]
fn load_theme_archive(app: AppHandle, theme_id: String) -> Result<Response, String> {
    let path = theme_archive_path(&app, &theme_id)?;
    if !path.exists() {
        return Ok(Response::new(Vec::<u8>::new()));
    }
    fs::read(path)
        .map(Response::new)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn delete_theme_archive(app: AppHandle, theme_id: String) -> Result<(), String> {
    let path = theme_archive_path(&app, &theme_id)?;
    if path.exists() {
        fs::remove_file(path).map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn detect_codex() -> Result<model::CodexDetection, String> {
    codex::detect_codex().map_err(|error| error.to_string())
}

#[tauri::command]
async fn quit_codex(state: State<'_, Mutex<AppRuntime>>) -> Result<model::CodexDetection, String> {
    let detection = codex::quit_codex()
        .await
        .map_err(|error| error.to_string())?;
    let mut runtime = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?;
    *runtime = AppRuntime::default();
    Ok(detection)
}

#[tauri::command]
fn runtime_status(state: State<'_, Mutex<AppRuntime>>) -> RuntimeStatus {
    state
        .lock()
        .map(|runtime| runtime.status())
        .unwrap_or_else(|_| RuntimeStatus::error("Runtime state is unavailable"))
}

#[tauri::command]
async fn launch_codex(state: State<'_, Mutex<AppRuntime>>) -> Result<RuntimeStatus, String> {
    if let Ok(runtime) = state.lock()
        && runtime.connected
    {
        return Ok(runtime.status());
    }

    let detection = codex::detect_codex().map_err(|error| error.to_string())?;
    if !detection.installed {
        return Err("Codex Desktop was not found on this device".into());
    }
    if detection.running {
        return Err(
            "Codex is already running. Close it first so Styler can relaunch it with a temporary loopback debugging port."
                .into(),
        );
    }

    {
        let mut runtime = state
            .lock()
            .map_err(|_| "Runtime state is unavailable".to_string())?;
        runtime.state = model::RuntimeState::Launching;
        runtime.message = None;
    }

    let session = cdp::launch_and_connect(
        detection
            .path
            .as_deref()
            .ok_or_else(|| "Codex executable path is unavailable".to_string())?,
    )
    .await
    .map_err(|error| error.to_string())?;

    let mut runtime = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?;
    runtime.state = model::RuntimeState::Connected;
    runtime.connected = true;
    runtime.started_by_styler = true;
    runtime.port = Some(session.port);
    runtime.websocket_url = Some(session.websocket_url);
    runtime.child_id = Some(session.child_id);
    runtime.codex_version = detection.version;
    runtime.compatibility = compatibility_for_version(runtime.codex_version.as_deref());
    runtime.message = Some("Connected through a temporary loopback-only CDP session".into());
    Ok(runtime.status())
}

#[tauri::command]
async fn apply_theme(
    theme: Value,
    variant: String,
    compatibility_mode: String,
    state: State<'_, Mutex<AppRuntime>>,
) -> Result<RuntimeStatus, String> {
    if variant != "light" && variant != "dark" {
        return Err("Theme variant must be light or dark".into());
    }
    if !is_valid_compatibility_mode(&compatibility_mode) {
        return Err("Compatibility mode must be auto, compatibility, or developer".into());
    }
    let websocket_url = {
        let runtime = state
            .lock()
            .map_err(|_| "Runtime state is unavailable".to_string())?;
        runtime
            .websocket_url
            .clone()
            .ok_or_else(|| "Codex is not connected".to_string())?
    };

    let theme_json = serde_json::to_string(&theme).map_err(|error| error.to_string())?;
    let variant_json = serde_json::to_string(&variant).map_err(|error| error.to_string())?;
    let mode_json =
        serde_json::to_string(&compatibility_mode).map_err(|error| error.to_string())?;
    let expression = format!(
        "{}\nwindow.__CODEX_STYLER_RUNTIME__.apply({}, {}, {});",
        include_str!("runtime.js"),
        theme_json,
        variant_json,
        mode_json,
    );

    let response = cdp::evaluate(&websocket_url, &expression)
        .await
        .map_err(|error| error.to_string())?;

    let outcome = response.pointer("/result/result/value");
    let resolved_mode = outcome
        .and_then(|value| value.get("resolvedMode"))
        .and_then(Value::as_str)
        .unwrap_or("compatibility");
    let fallback_reason = outcome
        .and_then(|value| value.get("reason"))
        .and_then(Value::as_str);

    let mut runtime = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?;
    runtime.state = model::RuntimeState::Applied;
    runtime.compatibility = if matches!(resolved_mode, "semantic" | "developer") {
        model::Compatibility::Supported
    } else {
        model::Compatibility::Safe
    };
    runtime.message = Some(match resolved_mode {
        "semantic" => "Theme applied after live Codex interface verification".into(),
        "developer" => "Theme applied in developer mode without compatibility enforcement".into(),
        _ => fallback_reason.map_or_else(
            || "Theme applied in isolated compatibility mode".into(),
            |reason| format!("Automatic verification fell back to compatibility mode: {reason}"),
        ),
    });
    Ok(runtime.status())
}

#[tauri::command]
async fn pause_theme(state: State<'_, Mutex<AppRuntime>>) -> Result<RuntimeStatus, String> {
    let websocket_url = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?
        .websocket_url
        .clone()
        .ok_or_else(|| "Codex is not connected".to_string())?;

    cdp::evaluate(&websocket_url, "window.__CODEX_STYLER_RUNTIME__?.pause();")
        .await
        .map_err(|error| error.to_string())?;

    let mut runtime = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?;
    runtime.state = model::RuntimeState::Paused;
    runtime.message = Some("Theme paused; the Codex connection remains available".into());
    Ok(runtime.status())
}

#[tauri::command]
async fn restore_official(state: State<'_, Mutex<AppRuntime>>) -> Result<RuntimeStatus, String> {
    let websocket_url = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?
        .websocket_url
        .clone();

    if let Some(url) = websocket_url {
        let _ = cdp::evaluate(&url, "window.__CODEX_STYLER_RUNTIME__?.restore();").await;
    }

    let mut runtime = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?;
    runtime.state = if runtime.connected {
        model::RuntimeState::Connected
    } else {
        model::RuntimeState::Idle
    };
    runtime.message = Some("All Codex Styler runtime nodes were removed".into());
    Ok(runtime.status())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(Mutex::new(AppRuntime::default()))
        .manage(PendingUpdate(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            detect_codex,
            quit_codex,
            runtime_status,
            launch_codex,
            apply_theme,
            pause_theme,
            restore_official,
            save_theme_archive,
            load_theme_archive,
            delete_theme_archive,
            check_for_updates,
            download_and_install_update,
            restart_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running Codex Styler");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn known_codex_version_uses_the_semantic_adapter() {
        assert_eq!(
            compatibility_for_version(Some("26.707.72221")),
            model::Compatibility::Supported
        );
        assert_eq!(
            compatibility_for_version(Some("26.707.91948")),
            model::Compatibility::Supported
        );
    }

    #[test]
    fn unknown_codex_version_remains_unverified_until_runtime_check() {
        assert_eq!(
            compatibility_for_version(Some("99.0.0")),
            model::Compatibility::Safe
        );
        assert_eq!(compatibility_for_version(None), model::Compatibility::Safe);
    }

    #[test]
    fn compatibility_mode_is_an_explicit_allowlist() {
        assert!(is_valid_compatibility_mode("auto"));
        assert!(is_valid_compatibility_mode("compatibility"));
        assert!(is_valid_compatibility_mode("developer"));
        assert!(!is_valid_compatibility_mode("force"));
    }

    #[test]
    fn theme_archive_ids_are_restricted_to_manifest_safe_characters() {
        assert!(is_valid_theme_id("local.quiet-garden-a1b2c"));
        assert!(is_valid_theme_id("codex-styler.native-refined"));
        assert!(!is_valid_theme_id("../quiet-garden"));
        assert!(!is_valid_theme_id("Local.Theme"));
        assert!(!is_valid_theme_id("ab"));
    }

    #[test]
    fn alpha_builds_select_the_newest_non_draft_prerelease() {
        let current = Version::parse("0.1.0-alpha.6").unwrap();
        let selected = select_release(
            &current,
            [
                GitHubRelease {
                    tag_name: "v0.1.0-alpha.7".into(),
                    draft: false,
                    prerelease: true,
                },
                GitHubRelease {
                    tag_name: "v0.1.0-alpha.8".into(),
                    draft: true,
                    prerelease: true,
                },
                GitHubRelease {
                    tag_name: "v0.1.0-alpha.4".into(),
                    draft: false,
                    prerelease: true,
                },
            ],
        )
        .unwrap();
        assert_eq!(selected.tag_name, "v0.1.0-alpha.7");
    }

    #[test]
    fn stable_builds_do_not_install_prerelease_updates() {
        let current = Version::parse("1.0.0").unwrap();
        let selected = select_release(
            &current,
            [
                GitHubRelease {
                    tag_name: "v1.1.0-alpha.1".into(),
                    draft: false,
                    prerelease: true,
                },
                GitHubRelease {
                    tag_name: "v1.0.1".into(),
                    draft: false,
                    prerelease: false,
                },
            ],
        )
        .unwrap();
        assert_eq!(selected.tag_name, "v1.0.1");
    }
}
