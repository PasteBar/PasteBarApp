use super::engine::{EngineSnapshot, SyncEngine};
use super::security::keys::{
  generate_recovery_key, recovery_key_from_string, recovery_key_to_string, RecoveryKey,
};
use super::types::SyncMode;
use once_cell::sync::Lazy;
use std::sync::Mutex;

static IMPORTED_RECOVERY_KEY: Lazy<Mutex<Option<RecoveryKey>>> = Lazy::new(|| Mutex::new(None));

pub fn set_sync_mode(engine: &SyncEngine, mode: SyncMode) -> Result<EngineSnapshot, String> {
  engine.set_mode(mode)?;
  Ok(engine.snapshot())
}

pub fn export_recovery_key() -> String {
  let key = generate_recovery_key();
  if let Ok(mut slot) = IMPORTED_RECOVERY_KEY.lock() {
    *slot = Some(key);
  }
  recovery_key_to_string(&key)
}

pub fn import_recovery_key(key: &str) -> Result<(), String> {
  let parsed = recovery_key_from_string(key)?;
  let mut slot = IMPORTED_RECOVERY_KEY
    .lock()
    .map_err(|_| "Recovery key storage lock poisoned".to_string())?;
  *slot = Some(parsed);
  Ok(())
}

pub fn imported_recovery_key() -> Result<Option<RecoveryKey>, String> {
  let slot = IMPORTED_RECOVERY_KEY
    .lock()
    .map_err(|_| "Recovery key storage lock poisoned".to_string())?;
  Ok(*slot)
}
