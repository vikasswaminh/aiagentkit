pub mod client;
pub mod error;
pub mod models;

pub mod proto {
    tonic::include_proto!("agent_platform");
}

pub use client::AgentPlatformClient;
pub use error::SdkError;
