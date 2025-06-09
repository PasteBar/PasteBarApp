use serde_yaml::Value;
use std::collections::HashMap;
use tauri::command;

use crate::services::user_settings_service::{
  get_all_settings, get_custom_db_path, get_setting, remove_custom_db_path, remove_setting,
  set_custom_db_path, set_setting,
};

/// Returns the current `custom_db_path` (if any).
#[command]
pub fn cmd_get_custom_db_path() -> Option<String> {
  get_custom_db_path()
}

/// Insert or update a new `custom_db_path`.
#[command]
pub fn cmd_set_custom_db_path(new_path: String) -> Result<(), String> {
  set_custom_db_path(&new_path)
}

/// Remove (clear) the `custom_db_path`.
#[command]
pub fn cmd_remove_custom_db_path() -> Result<(), String> {
  remove_custom_db_path()
}

/// Return all key-value pairs from the `data` map.
#[command]
pub fn cmd_get_all_settings() -> HashMap<String, Value> {
  get_all_settings()
}

/// Return a single setting by key (from the `data` map).
#[command]
pub fn cmd_get_setting(key: String) -> Option<Value> {
  get_setting(&key)
}

/// Insert (or update) a setting in the `data` map.
/// `value_yaml` is a string containing valid YAML (e.g. `"true"`, `"42"`, `"some string"`).
#[command]
pub fn cmd_set_setting(key: String, value_yaml: String) -> Result<(), String> {
  // If your front end only sends strings,
  // you could store them directly as `Value::String(value_yaml)`.
  // But here we parse the YAML so you can handle booleans, numbers, etc.
  match serde_yaml::from_str::<Value>(&value_yaml) {
    Ok(val) => set_setting(&key, val),
    Err(e) => Err(format!("Failed to parse YAML string: {}", e)),
  }
}

/// Remove a setting by key from the `data` map.
#[command]
pub fn cmd_remove_setting(key: String) -> Result<(), String> {
  remove_setting(&key)
}
