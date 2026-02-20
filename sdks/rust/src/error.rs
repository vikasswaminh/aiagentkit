use thiserror::Error;

#[derive(Error, Debug)]
pub enum SdkError {
    #[error("gRPC transport error: {0}")]
    Transport(#[from] tonic::transport::Error),

    #[error("gRPC status error: {0}")]
    Status(#[from] tonic::Status),

    #[error("not found: {0}")]
    NotFound(String),

    #[error("policy denied: {0}")]
    PolicyDenied(String),

    #[error("budget exhausted: {0}")]
    BudgetExhausted(String),
}

pub type Result<T> = std::result::Result<T, SdkError>;
