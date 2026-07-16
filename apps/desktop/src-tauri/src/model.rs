use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexDetection {
    pub installed: bool,
    pub running: bool,
    pub path: Option<String>,
    pub version: Option<String>,
    pub platform: String,
}

#[derive(Debug, Clone, Copy, Serialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeState {
    #[default]
    Idle,
    Launching,
    Connected,
    Applied,
    Paused,
    Error,
}

#[derive(Debug, Clone, Copy, Serialize, Default)]
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
}

impl AppRuntime {
    pub fn status(&self) -> RuntimeStatus {
        RuntimeStatus {
            state: self.state,
            connected: self.connected,
            started_by_styler: self.started_by_styler,
            port: self.port,
            codex_version: self.codex_version.clone(),
            compatibility: self.compatibility,
            message: self.message.clone(),
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
        }
    }
}
