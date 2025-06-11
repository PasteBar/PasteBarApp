use serde_yaml::Value;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use tauri::command;

use crate::db::{
  get_clip_images_dir, get_clipboard_images_dir, get_data_dir, get_db_path, get_default_data_dir,
  get_default_db_path_string,
};
use crate::services::user_settings_service::{
  self as user_settings_service, get_all_settings, get_custom_db_path, get_setting,
  remove_custom_db_path, remove_setting, set_custom_db_path, set_setting,
};
use fs_extra::dir::{copy, CopyOptions};
use std::path::PathBuf;

#[derive(serde::Serialize)]
pub enum PathStatus {
  Empty,
  NotEmpty,
  IsPastebarDataAndNotEmpty,
}

/// Checks the status of a given path.
#[command]
pub fn cmd_check_custom_data_path(path_str: String) -> Result<PathStatus, String> {
  let path = Path::new(&path_str);
  if !path.exists() || !path.is_dir() {
    return Ok(PathStatus::Empty); // Treat non-existent paths as empty for this purpose
  }

  if path.file_name().and_then(|n| n.to_str()) == Some("pastebar-data") {
    if path.read_dir().map_err(|e| e.to_string())?.next().is_some() {
      return Ok(PathStatus::IsPastebarDataAndNotEmpty);
    }
  }

  // Check if directory contains PasteBar database files
  let has_dev_db = path.join("local.pastebar-db.data").exists();
  let has_prod_db = path.join("pastebar-db.data").exists();

  if has_dev_db || has_prod_db {
    return Ok(PathStatus::IsPastebarDataAndNotEmpty);
  }

  if path.read_dir().map_err(|e| e.to_string())?.next().is_some() {
    return Ok(PathStatus::NotEmpty);
  }

  Ok(PathStatus::Empty)
}

/// Returns the current `custom_db_path` (if any).
#[command]
pub fn cmd_get_custom_db_path() -> Option<String> {
  get_custom_db_path()
}

// cmd_set_custom_db_path is now part of cmd_set_and_relocate_db
// cmd_remove_custom_db_path is now part of cmd_revert_to_default_db_location

/// Validates if the provided path is a writable directory.
#[command]
pub fn cmd_validate_custom_db_path(path_str: String) -> Result<bool, String> {
  let path = Path::new(&path_str);
  if !path.exists() {
    // Attempt to create it if it doesn't exist, to check writability of parent
    if let Some(parent) = path.parent() {
      if !parent.exists() {
        fs::create_dir_all(parent).map_err(|e| {
          format!(
            "Failed to create parent directory {}: {}",
            parent.display(),
            e
          )
        })?;
      }
    }
    // Check if we can create the directory itself (simulates future db file creation in this dir)
    fs::create_dir_all(&path).map_err(|e| {
      format!(
        "Path {} is not a valid directory or cannot be created: {}",
        path.display(),
        e
      )
    })?;
    // Clean up by removing the directory if we created it for validation
    fs::remove_dir(&path).map_err(|e| {
      format!(
        "Failed to clean up validation directory {}: {}",
        path.display(),
        e
      )
    })?;
  } else if !path.is_dir() {
    return Err(format!("Path {} is not a directory.", path_str));
  }

  // Check writability by trying to create a temporary file
  let temp_file_path = path.join(".tmp_pastebar_writable_check");
  match fs::File::create(&temp_file_path) {
    Ok(_) => {
      fs::remove_file(&temp_file_path)
        .map_err(|e| format!("Failed to remove temporary check file: {}", e))?;
      Ok(true)
    }
    Err(e) => Err(format!("Directory {} is not writable: {}", path_str, e)),
  }
}

/// Sets the custom data path, and moves/copies the data directory.
#[command]
pub fn cmd_set_and_relocate_data(
  new_parent_dir_path: String,
  operation: String,
) -> Result<String, String> {
  let current_data_dir = get_data_dir();
  let new_data_dir = PathBuf::from(&new_parent_dir_path);

  fs::create_dir_all(&new_data_dir)
    .map_err(|e| format!("Failed to create new data directory: {}", e))?;

  let items_to_relocate = vec!["pastebar-db.data", "clip-images", "clipboard-images"];

  for item_name in items_to_relocate {
    let source_path = current_data_dir.join(item_name);
    let dest_path = new_data_dir.join(item_name);

    if !source_path.exists() {
      println!(
        "Source item {} does not exist, skipping.",
        source_path.display()
      );
      continue;
    }

    match operation.as_str() {
      "move" => {
        if source_path.is_dir() {
          fs::rename(&source_path, &dest_path).map_err(|e| {
            format!(
              "Failed to move directory {} to {}: {}",
              source_path.display(),
              dest_path.display(),
              e
            )
          })?;
        } else {
          fs::rename(&source_path, &dest_path).map_err(|e| {
            format!(
              "Failed to move file {} to {}: {}",
              source_path.display(),
              dest_path.display(),
              e
            )
          })?;
        }
      }
      "copy" => {
        if source_path.is_dir() {
          let mut options = CopyOptions::new();
          options.overwrite = true;
          copy(&source_path, &dest_path, &options)
            .map_err(|e| format!("Failed to copy directory: {}", e))?;
        } else {
          fs::copy(&source_path, &dest_path).map_err(|e| format!("Failed to copy file: {}", e))?;
        }
      }
      "none" => {
        // Do nothing, just switch to the new location
      }
      _ => return Err("Invalid operation specified. Use 'move', 'copy', or 'none'.".to_string()),
    }
  }

  user_settings_service::set_custom_db_path(&new_parent_dir_path)?;

  Ok(format!(
    "Data successfully {} to {}. Please restart the application.",
    operation,
    new_data_dir.display()
  ))
}

/// Clears the custom data path setting.
#[command]
pub fn cmd_revert_to_default_data_location() -> Result<String, String> {
  // Simply remove the custom database path setting
  remove_custom_db_path()?;

  Ok("Custom database location setting removed successfully.".to_string())
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
