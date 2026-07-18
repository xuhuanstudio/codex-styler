use thiserror::Error;

#[derive(Debug, Error)]
pub enum StylerError {
    #[error("Codex Desktop was not found")]
    CodexNotFound,
    #[error("Could not reserve a loopback port: {0}")]
    Port(#[from] std::io::Error),
    #[error("Could not communicate with the Codex debugging endpoint: {0}")]
    Http(#[from] reqwest::Error),
    #[error("Could not open the Codex debugging socket: {0}")]
    WebSocket(#[from] tokio_tungstenite::tungstenite::Error),
    #[error("Codex did not expose a trusted page target before the connection timeout")]
    TargetTimeout,
    #[error("Codex could not be launched: {0}")]
    Launch(String),
    #[error("Codex rejected the runtime expression: {0}")]
    Runtime(String),
}

impl StylerError {
    pub fn is_connection_loss(&self) -> bool {
        matches!(self, Self::WebSocket(_))
            || matches!(self, Self::Runtime(message) if message.contains("socket closed"))
    }
}
