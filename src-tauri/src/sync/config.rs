use super::types::SyncMode;

#[derive(Debug, Clone)]
pub struct SyncConfig {
  pub mode: SyncMode,
}

impl Default for SyncConfig {
  fn default() -> Self {
    Self {
      mode: SyncMode::Off,
    }
  }
}
