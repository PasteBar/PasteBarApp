#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SyncMode {
  Off,
  On,
  Paused,
}

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PingRequest {
  pub request_id: String,
  pub source_device_id: String,
  pub target_device_id: String,
  pub id: String,
  pub time: i64,
  pub pong: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PongResponse {
  pub request_id: String,
  pub source_device_id: String,
  pub target_device_id: String,
  pub id: String,
  pub time: i64,
  pub pong: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairRequestInfo {
  pub request_id: String,
  pub code: String,
  pub requester_device_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairAckResponse {
  pub request_id: String,
  pub accepted: bool,
  pub host_device_id: String,
  pub reason: Option<String>,
}

use crate::sync::history_sync::HistorySyncChange;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistorySyncPushRequest {
  pub request_id: String,
  pub source_device_id: String,
  pub target_device_id: String,
  pub changes: Vec<HistorySyncChange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistorySyncAckResponse {
  pub request_id: String,
  pub host_device_id: String,
  pub accepted: bool,
  pub applied_count: usize,
  pub last_applied_seq: i64,
  pub reason: Option<String>,
}
