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
    let has_dev_db_in_subfolder = pastebar_data_subfolder.join("local.pastebar-db.data").exists();
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
  fs::create_dir_all(&path).map_err(|e| {
    format!(
      "Failed to create directory {}: {}",
      path.display(),
      e
    )
  })?;
  Ok(())
}

/// Validates if the provided path is suitable for a custom database location.
/// Checks for path traversal, parent directory writability (if path doesn't exist),
/// or target directory writability (if path exists).
#[command]
pub fn cmd_validate_custom_db_path(path_str: String) -> Result<bool, String> {
  let input_path_buf = PathBuf::from(&path_str);

  // Initial security check for '..' components in the raw path string.
  for component in input_path_buf.components() {
    if component == std::path::Component::ParentDir {
      return Err(format!(
        "Path {} contains '..' and is considered unsafe.",
        path_str
      ));
    }
    if component.as_os_str() == ".." {
      return Err(format!(
        "Path {} contains '..' component name and is considered unsafe.",
        path_str
      ));
    }
  }

  let path_to_check_writability: PathBuf;
  let type_of_check: &str; // "target directory" or "parent directory"

  if input_path_buf.exists() {
    if !input_path_buf.is_dir() {
      return Err(format!(
        "Path {} exists but is not a directory.",
        path_str
      ));
    }
    path_to_check_writability = input_path_buf.clone();
    type_of_check = "target directory";
  } else {
    // Path does not exist, check parent directory.
    let parent_dir = input_path_buf.parent().ok_or_else(|| {
      format!(
        "Cannot get parent directory for path {}. Please provide a valid path.",
        path_str
      )
    })?;

    if !parent_dir.exists() {
      return Err(format!(
        "Parent directory {} does not exist. Please create it first.",
        parent_dir.display()
      ));
    }
    if !parent_dir.is_dir() {
      return Err(format!(
        "Parent path {} is not a directory.",
        parent_dir.display()
      ));
    }
    path_to_check_writability = parent_dir.to_path_buf();
    type_of_check = "parent directory";
  }

  // Perform writability check by creating a temporary file in path_to_check_writability
  let temp_file_name = format!(".tmp_pastebar_writable_check_{}", std::process::id());
  let temp_file_path = path_to_check_writability.join(&temp_file_name);

  match fs::File::create(&temp_file_path) {
    Ok(_) => {
      fs::remove_file(&temp_file_path)
        .map_err(|e| format!("Failed to remove temporary check file {}: {}", temp_file_path.display(), e))?;
    }
    Err(e) => {
      return Err(format!(
        "The {} {} is not writable: {}",
        type_of_check,
        path_to_check_writability.display(),
        e
      ));
    }
  }

  // Canonicalize the path
  // If input_path_buf exists, canonicalize it directly.
  // If not, canonicalize its existing parent and append the intended filename/dirname.
  let canonical_path: PathBuf;
  if input_path_buf.exists() {
    canonical_path = fs::canonicalize(&input_path_buf).map_err(|e| {
      format!(
        "Failed to canonicalize existing path {}: {}",
        input_path_buf.display(),
        e
      )
    })?;
  } else {
    // Parent directory is confirmed to exist and be a directory from checks above.
    let parent_dir = input_path_buf.parent().unwrap(); // Safe due to earlier checks
    let file_name = input_path_buf.file_name().ok_or_else(|| {
      format!("Path {} does not have a file/directory name.", path_str)
    })?;

    let canonical_parent = fs::canonicalize(parent_dir).map_err(|e| {
      format!(
        "Failed to canonicalize parent directory {}: {}",
        parent_dir.display(),
        e
      )
    })?;
    canonical_path = canonical_parent.join(file_name);
  }

  // After canonicalization, re-check for '..' components.
  for component in canonical_path.components() {
    if component == std::path::Component::ParentDir {
      return Err(format!(
        "Canonicalized path {} still contains '..' component, which is unsafe.",
        canonical_path.display()
      ));
    }
     if component.as_os_str() == ".." {
        return Err(format!(
            "Canonicalized path {} still contains '..' name component, which is unsafe.",
            canonical_path.display()
        ));
    }
  }

  Ok(true)
}

/// Sets the custom data path, and moves/copies the data directory.
#[command]
pub fn cmd_set_and_relocate_data(
  new_parent_dir_path: String,
  operation: String,
) -> Result<String, String> {
  let current_data_dir = get_data_dir();
  // new_data_dir is the new PARENT directory where items like 'pastebar-db.data' will reside.
  let new_data_dir = PathBuf::from(&new_parent_dir_path);

  fs::create_dir_all(&new_data_dir)
    .map_err(|e| format!("Failed to create new data directory parent {}: {}", new_data_dir.display(), e))?;

  let items_to_relocate = vec!["pastebar-db.data", "clip-images", "clipboard-images"];
  let mut backup_dir_path_opt: Option<PathBuf> = None;

  if operation == "move" {
    let backup_base_name = current_data_dir.file_name().unwrap_or_default().to_str().unwrap_or("pastebar-data");
    // Using a fixed suffix for simplicity, a timestamp would be better for multiple quick retries.
    let backup_folder_name_str = format!("{}-backup-migration", backup_base_name);
    let backup_dir = current_data_dir.with_file_name(backup_folder_name_str);

    if backup_dir.exists() {
      fs::remove_dir_all(&backup_dir)
        .map_err(|e| format!("Failed to remove existing backup directory {}: {}", backup_dir.display(), e))?;
    }
    fs::create_dir_all(&backup_dir)
      .map_err(|e| format!("Failed to create backup directory {}: {}", backup_dir.display(), e))?;

    backup_dir_path_opt = Some(backup_dir.clone()); // Save for later use

    println!("Backing up data to {}", backup_dir.display());
    for item_name in &items_to_relocate {
      let source_item_path = current_data_dir.join(item_name);
      if source_item_path.exists() {
        let backup_item_path = backup_dir.join(item_name);
        let copy_options = CopyOptions { overwrite: true, ..Default::default() };
        if source_item_path.is_dir() {
          copy(&source_item_path, &backup_item_path, &copy_options).map_err(|e| {
            // Attempt to clean up partial backup before erroring
            let _ = fs::remove_dir_all(&backup_dir);
            format!("Backup failed for directory {}: {}", source_item_path.display(), e)
          })?;
        } else {
          fs::copy(&source_item_path, &backup_item_path).map_err(|e| {
            // Attempt to clean up partial backup before erroring
            let _ = fs::remove_dir_all(&backup_dir);
            format!("Backup failed for file {}: {}", source_item_path.display(), e)
          })?;
        }
      }
    }
    println!("Backup completed to {}", backup_dir.display());
  }

  let mut moved_items_dest_paths: Vec<PathBuf> = Vec::new();

  for item_name_str in items_to_relocate {
    let item_name = Path::new(item_name_str);
    let source_path = current_data_dir.join(item_name);
    let dest_path = new_data_dir.join(item_name);

    if !source_path.exists() {
      println!("Source item {} does not exist, skipping.", source_path.display());
      continue;
    }

    match operation.as_str() {
      "move" => {
        let current_backup_dir = backup_dir_path_opt.as_ref().expect("Backup path should exist for move operation");
        println!("Moving {} to {}", source_path.display(), dest_path.display());
        if let Err(move_err) = fs::rename(&source_path, &dest_path) {
          eprintln!("Error moving {}: {}. Attempting rollback.", source_path.display(), move_err);

          // 1. Move back already moved items from dest_path to source_path
          for moved_dest_path in moved_items_dest_paths.iter().rev() {
            let original_item_name = moved_dest_path.file_name().unwrap();
            let original_source_path = current_data_dir.join(original_item_name);
            if moved_dest_path.exists() { // Ensure it's there before trying to move
                if let Err(e) = fs::rename(moved_dest_path, &original_source_path) {
                    eprintln!("Rollback error: Failed to move {} back to {}: {}", moved_dest_path.display(), original_source_path.display(), e);
                }
            }
          }
          moved_items_dest_paths.clear();

          // 2. Restore from backup
          println!("Restoring from backup directory: {}", current_backup_dir.display());
          for bk_item_name_str in &items_to_relocate {
            let bk_item_name = Path::new(bk_item_name_str);
            let backup_item_path = current_backup_dir.join(bk_item_name);
            if backup_item_path.exists() {
              let target_restore_path = current_data_dir.join(bk_item_name);
              if target_restore_path.exists() {
                if target_restore_path.is_dir() {
                  fs::remove_dir_all(&target_restore_path).unwrap_or_else(|e| eprintln!("Rollback: Failed to remove dir during restore {}: {}", target_restore_path.display(), e));
                } else {
                  fs::remove_file(&target_restore_path).unwrap_or_else(|e| eprintln!("Rollback: Failed to remove file during restore {}: {}", target_restore_path.display(), e));
                }
              }
              let copy_options = CopyOptions { overwrite: true, ..Default::default() };
              if backup_item_path.is_dir() {
                copy(&backup_item_path, &target_restore_path, &copy_options).unwrap_or_else(|e| {eprintln!("Rollback: Failed to copy dir from backup {}: {}", backup_item_path.display(), e); 0});
              } else {
                fs::copy(&backup_item_path, &target_restore_path).unwrap_or_else(|e| {eprintln!("Rollback: Failed to copy file from backup {}: {}", backup_item_path.display(), e); 0});
              }
            }
          }

          // 3. Clean up backup directory as restore was attempted
          fs::remove_dir_all(&current_backup_dir).unwrap_or_else(|e| eprintln!("Rollback: Failed to remove backup dir {}: {}", current_backup_dir.display(), e));

          return Err(format!("Failed to move {}: {}. Operation rolled back using backup.", source_path.display(), move_err));
        }
        moved_items_dest_paths.push(dest_path.clone());
      }
      "copy" => {
        let copy_options = CopyOptions { overwrite: true, ..Default::default() };
        if source_path.is_dir() {
          copy(&source_path, &dest_path, &copy_options)
            .map_err(|e| format!("Failed to copy directory {} to {}: {}", source_path.display(), dest_path.display(), e))?;
        } else {
          fs::copy(&source_path, &dest_path)
            .map_err(|e| format!("Failed to copy file {} to {}: {}", source_path.display(), dest_path.display(), e))?;
        }
      }
      "none" => {
        // Do nothing, just switch to the new location
      }
      _ => return Err("Invalid operation specified. Use 'move', 'copy', or 'none'.".to_string()),
    }
  }

  if let Err(settings_err) = user_settings_service::set_custom_db_path(&new_parent_dir_path) {
    if operation == "move" {
      if let Some(ref bk_dir) = backup_dir_path_opt {
        eprintln!("CRITICAL: Failed to update settings ({}) after moving data. Attempting to roll back data move.", settings_err);
        let mut rollback_successful = true;
        for item_name_str in &items_to_relocate {
          let item_name = Path::new(item_name_str);
          let moved_item_path = new_data_dir.join(item_name);
          if moved_item_path.exists() {
            let original_source_path = current_data_dir.join(item_name);
            // Ensure target for rollback is clean or doesn't exist if it's a file
            if original_source_path.exists() && !original_source_path.is_dir() {
                 fs::remove_file(&original_source_path).unwrap_or_else(|e| eprintln!("Settings rollback: Failed to remove file at original source {}: {}", original_source_path.display(), e));
            } else if original_source_path.exists() && original_source_path.is_dir() {
                 // For directories, rename expects target not to exist or to be empty on some platforms.
                 // If original source path (directory) exists and is not empty, rename might fail.
                 // This part of rollback might need to be more robust (e.g. clean restore from backup)
            }

            if let Err(e) = fs::rename(&moved_item_path, &original_source_path) {
              eprintln!("Settings rollback: Could not move {} back to {}: {}", moved_item_path.display(), original_source_path.display(), e);
              rollback_successful = false;
            }
          }
        }

        if rollback_successful {
          println!("Settings rollback: Data relocation was successfully rolled back to {}.", current_data_dir.display());
          fs::remove_dir_all(&bk_dir).unwrap_or_else(|e| eprintln!("Settings rollback: Failed to remove backup dir {}: {}", bk_dir.display(), e));
          return Err(format!("Failed to update settings: {}. Data relocation was rolled back. Original data location is active.", settings_err));
        } else {
          return Err(format!(
            "CRITICAL: Failed to update settings ({}) after moving data. Also failed to automatically roll back the data move. Data is currently in {}. A backup is available at {}. Please manually restore data to {} or update settings to point to the new location if appropriate.",
            settings_err,
            new_data_dir.display(),
            bk_dir.display(),
            current_data_dir.display()
          ));
        }
      }
    }
    // For "copy" or "none" operation, or if backup_dir_path_opt was None for "move" (which shouldn't happen)
    return Err(format!("Data {} was successful to {}, but failed to update settings: {}. If data was copied, it resides in both locations. If data was moved, it is in the new location but the application is not yet configured to use it. Backup (if applicable) may still be present.", operation, new_data_dir.display(), settings_err));
  }

  // Success: Clean up backup (if "move")
  if operation == "move" {
    if let Some(bk_dir) = backup_dir_path_opt {
      if bk_dir.exists() {
        println!("Operation successful, removing backup directory: {}", bk_dir.display());
        fs::remove_dir_all(&bk_dir)
          .map_err(|e| format!("Move successful and settings updated, but failed to remove backup directory {}: {}", bk_dir.display(), e))?;
      }
    }
  }

  Ok(format!(
    "Data successfully {} to {}. Please restart the application.",
    operation,
    new_data_dir.display() // This is the new parent directory
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
