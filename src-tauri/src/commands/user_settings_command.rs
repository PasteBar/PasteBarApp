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

fn rollback_moves(items: &[(PathBuf, PathBuf)]) {
  for (src, dest) in items.iter().rev() {
    if dest.exists() {
      if dest.is_dir() {
        let mut options = CopyOptions::new();
        options.overwrite = true;
        let _ = copy(dest, src, &options);
        let _ = fs::remove_dir_all(dest);
      } else {
        let _ = fs::copy(dest, src);
        let _ = fs::remove_file(dest);
      }
    }
  }
}

#[derive(serde::Serialize)]
pub enum PathStatus {
  Empty,
  NotEmpty,
  IsPastebarDataAndNotEmpty,
  HasPastebarDataSubfolder,
}

/// Checks the status of a given path.
#[command]
pub fn cmd_check_custom_data_path(path_str: String) -> Result<PathStatus, String> {
  let path = Path::new(&path_str);
  if !path.exists() || !path.is_dir() {
    return Ok(PathStatus::Empty); // Treat non-existent paths as empty for this purpose
  }

  // Check if the selected path itself is named "pastebar-data"
  if path.file_name().and_then(|n| n.to_str()) == Some("pastebar-data") {
    if path.read_dir().map_err(|e| e.to_string())?.next().is_some() {
      return Ok(PathStatus::IsPastebarDataAndNotEmpty);
    }
  }

  // Check if directory contains PasteBar database files directly
  let has_dev_db = path.join("local.pastebar-db.data").exists();
  let has_prod_db = path.join("pastebar-db.data").exists();

  if has_dev_db || has_prod_db {
    return Ok(PathStatus::IsPastebarDataAndNotEmpty);
  }

  // Check if there's a "pastebar-data" subfolder in the selected directory
  let pastebar_data_subfolder = path.join("pastebar-data");
  if pastebar_data_subfolder.exists() && pastebar_data_subfolder.is_dir() {
    // Check if the pastebar-data subfolder contains database files
    let has_dev_db_in_subfolder = pastebar_data_subfolder
      .join("local.pastebar-db.data")
      .exists();
    let has_prod_db_in_subfolder = pastebar_data_subfolder.join("pastebar-db.data").exists();

    if has_dev_db_in_subfolder || has_prod_db_in_subfolder {
      return Ok(PathStatus::IsPastebarDataAndNotEmpty);
    } else {
      return Ok(PathStatus::HasPastebarDataSubfolder);
    }
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

/// Creates a directory at the specified path.
#[command]
pub fn cmd_create_directory(path_str: String) -> Result<(), String> {
  let path = Path::new(&path_str);
  fs::create_dir_all(&path)
    .map_err(|e| format!("Failed to create directory {}: {}", path.display(), e))?;
  Ok(())
}

/// Validates if the provided path is a writable directory.
#[command]
pub fn cmd_validate_custom_db_path(path_str: String) -> Result<bool, String> {
  let input_path = PathBuf::from(&path_str);

  if input_path
    .components()
    .any(|c| matches!(c, std::path::Component::ParentDir))
  {
    return Err("Path traversal not allowed".to_string());
  }

  let path = if input_path.exists() {
    input_path
      .canonicalize()
      .map_err(|e| format!("Invalid path: {}", e))?
  } else {
    input_path
  };

  if path.exists() && !path.is_dir() {
    return Err(format!("Path {} is not a directory.", path.display()));
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

  let mut moved_items: Vec<(PathBuf, PathBuf)> = Vec::new();

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
          let mut options = CopyOptions::new();
          options.overwrite = true;
          copy(&source_path, &dest_path, &options)
            .map_err(|e| format!("Failed to copy directory: {}", e))?;
          if let Err(e) = fs::remove_dir_all(&source_path) {
            let _ = fs_extra::dir::remove(&dest_path);
            rollback_moves(&moved_items);
            return Err(format!("Failed to remove original directory: {}", e));
          }
        } else {
          fs::copy(&source_path, &dest_path).map_err(|e| format!("Failed to copy file: {}", e))?;
          if let Err(e) = fs::remove_file(&source_path) {
            let _ = fs::remove_file(&dest_path);
            rollback_moves(&moved_items);
            return Err(format!("Failed to remove original file: {}", e));
          }
        }
        moved_items.push((source_path.clone(), dest_path.clone()));
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
  crate::db::reinitialize_connection_pool();

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
  crate::db::reinitialize_connection_pool();

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
