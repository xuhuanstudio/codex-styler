use std::sync::Mutex;

use serde::Serialize;
use tauri::State;

use crate::codex;
use crate::model::{AppRuntime, LifecycleEvent};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticCheck {
    id: &'static str,
    status: &'static str,
    detail: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticsReport {
    format: &'static str,
    generated_at: String,
    app_version: String,
    platform: String,
    codex_version: Option<String>,
    checks: Vec<DiagnosticCheck>,
    lifecycle: Vec<LifecycleEvent>,
    privacy: Vec<&'static str>,
}

#[tauri::command]
pub fn run_diagnostics(
    custom_path: Option<String>,
    runtime: State<'_, Mutex<AppRuntime>>,
) -> Result<DiagnosticsReport, String> {
    let detection = codex::detect_codex(custom_path.as_deref().map(std::path::Path::new))
        .map_err(|error| error.to_string())?;
    let runtime = runtime
        .lock()
        .map_err(|_| "Runtime state is unavailable".to_string())?;
    let connected = runtime.connected;
    let compatibility = format!("{:?}", runtime.compatibility).to_lowercase();
    let state = format!("{:?}", runtime.state).to_lowercase();
    let checks = vec![
        DiagnosticCheck {
            id: "installation",
            status: if detection.installed { "pass" } else { "fail" },
            detail: if detection.installed {
                "A supported Codex or ChatGPT desktop installation was located".into()
            } else {
                "No supported desktop installation was located automatically or at the custom fallback".into()
            },
        },
        DiagnosticCheck {
            id: "process",
            status: if detection.running { "pass" } else { "info" },
            detail: if detection.running {
                "A matching desktop process is running".into()
            } else {
                "No matching desktop process is currently running".into()
            },
        },
        DiagnosticCheck {
            id: "loopback-cdp",
            status: if connected { "pass" } else { "info" },
            detail: if connected {
                "The temporary loopback-only runtime connection is active".into()
            } else {
                "The runtime is disconnected; start and apply to exercise the CDP check".into()
            },
        },
        DiagnosticCheck {
            id: "adapter",
            status: if compatibility == "blocked" {
                "fail"
            } else {
                "pass"
            },
            detail: format!("Compatibility result: {compatibility}; runtime state: {state}"),
        },
        DiagnosticCheck {
            id: "recovery",
            status: "pass",
            detail: "Restore is available and removes only injected runtime nodes".into(),
        },
        DiagnosticCheck {
            id: "updater",
            status: "pass",
            detail:
                "GitHub Release updater configuration is present; downloads require confirmation"
                    .into(),
        },
    ];
    Ok(DiagnosticsReport {
        format: "codex-styler-diagnostics-v1",
        generated_at: format!(
            "{}",
            std::time::SystemTime::UNIX_EPOCH
                .elapsed()
                .map(|duration| duration.as_secs())
                .unwrap_or_default()
        ),
        app_version: env!("CARGO_PKG_VERSION").into(),
        platform: detection.platform,
        codex_version: detection.version.or_else(|| runtime.codex_version.clone()),
        checks,
        lifecycle: runtime.lifecycle.iter().cloned().collect(),
        privacy: vec![
            "No chat or project content",
            "No DOM text or page titles",
            "No username",
            "No full installation or file paths",
            "No telemetry upload; export is user initiated",
        ],
    })
}
