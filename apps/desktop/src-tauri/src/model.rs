use std::{collections::VecDeque, time::SystemTime};

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LifecycleEvent {
    pub timestamp_ms: u128,
    pub action: String,
    pub outcome: String,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexDetection {
    pub installed: bool,
    pub running: bool,
    pub path: Option<String>,
    pub version: Option<String>,
    pub platform: String,
}

#[derive(Debug, Clone, Copy, Serialize, Default, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeState {
    #[default]
    Disconnected,
    Launching,
    Connected,
    Applying,
    Applied,
    Fallback,
    Paused,
    Error,
}

#[derive(Debug, Clone, Copy, Serialize, Default, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
#[allow(dead_code)]
pub enum Compatibility {
    Supported,
    #[default]
    Safe,
    Blocked,
}

#[derive(Debug, Default)]
pub struct AppRuntime {
    pub state: RuntimeState,
    pub connected: bool,
    pub started_by_styler: bool,
    pub port: Option<u16>,
    pub websocket_url: Option<String>,
    pub child_id: Option<u32>,
    pub codex_version: Option<String>,
    pub compatibility: Compatibility,
    pub message: Option<String>,
    pub revision: u64,
    pub lifecycle: VecDeque<LifecycleEvent>,
}

impl AppRuntime {
    pub fn record(&mut self, action: &str, outcome: &str, duration_ms: u64) {
        self.lifecycle.push_back(LifecycleEvent {
            timestamp_ms: SystemTime::UNIX_EPOCH
                .elapsed()
                .map(|duration| duration.as_millis())
                .unwrap_or_default(),
            action: action.into(),
            outcome: outcome.into(),
            duration_ms,
        });
        while self.lifecycle.len() > 80 {
            self.lifecycle.pop_front();
        }
    }

    pub fn status(&self) -> RuntimeStatus {
        RuntimeStatus {
            state: self.state,
            connected: self.connected,
            started_by_styler: self.started_by_styler,
            port: self.port,
            codex_version: self.codex_version.clone(),
            compatibility: self.compatibility,
            message: self.message.clone(),
            revision: self.revision,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeStatus {
    pub state: RuntimeState,
    pub connected: bool,
    pub started_by_styler: bool,
    pub port: Option<u16>,
    pub codex_version: Option<String>,
    pub compatibility: Compatibility,
    pub message: Option<String>,
    pub revision: u64,
}

impl RuntimeStatus {
    pub fn error(message: impl Into<String>) -> Self {
        Self {
            state: RuntimeState::Error,
            connected: false,
            started_by_styler: false,
            port: None,
            codex_version: None,
            compatibility: Compatibility::Safe,
            message: Some(message.into()),
            revision: 0,
        }
    }
}
