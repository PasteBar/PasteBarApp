use serde::{Deserialize, Serialize};
use serde_yaml;
use std::collections::HashMap;

use crate::db::get_config_file_path;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct UserConfig {
  /// The custom DB path, if user specified one.
  pub custom_db_path: Option<String>,

  /// General-purpose key-value settings.
  #[serde(default)]
  pub data: HashMap<String, serde_yaml::Value>,
}

pub fn load_user_config() -> UserConfig {
  let path = get_config_file_path();
  if !path.exists() {
    return UserConfig::default();
  }

  match std::fs::read_to_string(&path) {
    Ok(contents) => match serde_yaml::from_str::<UserConfig>(&contents) {
      Ok(cfg) => cfg,
      Err(e) => {
        eprintln!("Error parsing user config YAML: {:#}", e);
        UserConfig::default()
      }
    },
    Err(e) => {
      eprintln!("Error reading user config file: {:#}", e);
      UserConfig::default()
    }
  }
}

/// Save the `UserConfig` back to `pastebar_settings.yaml`.
pub fn save_user_config(cfg: &UserConfig) -> Result<(), String> {
  let path = get_config_file_path();
  if let Some(parent) = path.parent() {
    std::fs::create_dir_all(parent)
      .map_err(|e| format!("Failed to create config directory: {}", e))?;
  }

  let yaml_str =
    serde_yaml::to_string(cfg).map_err(|e| format!("Failed to serialize config to YAML: {}", e))?;
  std::fs::write(&path, yaml_str).map_err(|e| format!("Failed to write config file: {}", e))?;

  Ok(())
}

// ===========================
//  Custom DB Path Methods
// ===========================

/// Get the current `custom_db_path` (if any).
pub fn get_custom_db_path() -> Option<String> {
  load_user_config().custom_db_path
}

/// Insert or update the `custom_db_path`.
pub fn set_custom_db_path(new_path: &str) -> Result<(), String> {
  let mut config = load_user_config();
  config.custom_db_path = Some(new_path.to_string());
  save_user_config(&config)
}

/// Remove (clear) the `custom_db_path`.
pub fn remove_custom_db_path() -> Result<(), String> {
  let mut config = load_user_config();
  config.custom_db_path = None;
  save_user_config(&config)
}

// ===========================
//  Key–Value data Methods
// ===========================

pub fn get_setting(key: &str) -> Option<serde_yaml::Value> {
  let config = load_user_config();
  config.data.get(key).cloned()
}

pub fn set_setting(key: &str, value: serde_yaml::Value) -> Result<(), String> {
  let mut config = load_user_config();
  config.data.insert(key.to_string(), value);
  save_user_config(&config)
}

pub fn remove_setting(key: &str) -> Result<(), String> {
  let mut config = load_user_config();
  config.data.remove(key);
  save_user_config(&config)
}

pub fn get_all_settings() -> HashMap<String, serde_yaml::Value> {
  load_user_config().data
}
