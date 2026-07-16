mod cdp;
mod codex;
mod error;
mod model;

use std::sync::Mutex;

use model::{AppRuntime, RuntimeStatus};
use serde_json::Value;
use tauri::State;

const SUPPORTED_CODEX_VERSIONS: &[&str] = &["26.707.72221", "26.707.91948"];

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
        .manage(Mutex::new(AppRuntime::default()))
        .invoke_handler(tauri::generate_handler![
            detect_codex,
            quit_codex,
            runtime_status,
            launch_codex,
            apply_theme,
            pause_theme,
            restore_official
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
}
