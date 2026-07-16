mod cdp;
mod codex;
mod error;
mod model;

use std::sync::Mutex;

use model::{AppRuntime, RuntimeStatus};
use serde_json::Value;
use tauri::State;

#[tauri::command]
fn detect_codex() -> Result<model::CodexDetection, String> {
    codex::detect_codex().map_err(|error| error.to_string())
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
    runtime.compatibility = model::Compatibility::Safe;
    runtime.message = Some("Connected through a temporary loopback-only CDP session".into());
    Ok(runtime.status())
}

#[tauri::command]
async fn apply_theme(
    theme: Value,
    variant: String,
    state: State<'_, Mutex<AppRuntime>>,
) -> Result<RuntimeStatus, String> {
    if variant != "light" && variant != "dark" {
        return Err("Theme variant must be light or dark".into());
    }
    let websocket_url = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?
        .websocket_url
        .clone()
        .ok_or_else(|| "Codex is not connected".to_string())?;

    let theme_json = serde_json::to_string(&theme).map_err(|error| error.to_string())?;
    let variant_json = serde_json::to_string(&variant).map_err(|error| error.to_string())?;
    let expression = format!(
        "{}\nwindow.__CODEX_STYLER_RUNTIME__.apply({}, {}, true);",
        include_str!("runtime.js"),
        theme_json,
        variant_json,
    );

    cdp::evaluate(&websocket_url, &expression)
        .await
        .map_err(|error| error.to_string())?;

    let mut runtime = state
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?;
    runtime.state = model::RuntimeState::Applied;
    runtime.message = Some("Theme applied in safe compatibility mode".into());
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
            runtime_status,
            launch_codex,
            apply_theme,
            pause_theme,
            restore_official
        ])
        .run(tauri::generate_context!())
        .expect("error while running Codex Styler");
}
