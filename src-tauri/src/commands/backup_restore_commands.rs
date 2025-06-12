use std::fs;
use std::path::{Path, PathBuf};
use std::io::Write;
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use zip::{ZipWriter, ZipArchive};
use zip::write::FileOptions;
use std::io::{Read, Seek};

use crate::db::{get_data_dir, get_db_path, get_clip_images_dir, get_clipboard_images_dir};
use crate::services::utils::debug_output;

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupInfo {
    pub filename: String,
    pub full_path: String,
    pub created_date: String,
    pub size: u64,
    pub size_formatted: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupListResponse {
    pub backups: Vec<BackupInfo>,
    pub total_size: u64,
    pub total_size_formatted: String,
}


fn get_backup_filename() -> String {
    let now = Local::now();
    format!("pastebar-data-backup-{}.zip", now.format("%Y-%m-%d-%H-%M"))
}

fn format_file_size(size: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB"];
    let mut size_f = size as f64;
    let mut unit_index = 0;
    
    while size_f >= 1024.0 && unit_index < UNITS.len() - 1 {
        size_f /= 1024.0;
        unit_index += 1;
    }
    
    if unit_index == 0 {
        format!("{} {}", size, UNITS[unit_index])
    } else {
        format!("{:.1} {}", size_f, UNITS[unit_index])
    }
}

fn add_directory_to_zip<W: Write + Seek>(
    zip: &mut ZipWriter<W>,
    dir_path: &Path,
    base_path: &Path,
) -> Result<(), Box<dyn std::error::Error>> {
    if !dir_path.exists() {
        debug_output(|| {
            println!("Directory does not exist: {}", dir_path.display());
        });
        return Ok(());
    }

    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    for entry in fs::read_dir(dir_path)? {
        let entry = entry?;
        let path = entry.path();
        let relative_path = path.strip_prefix(base_path)?;

        if path.is_dir() {
            // Add directory entry
            let dir_name = format!("{}/", relative_path.display());
            zip.start_file(dir_name, options)?;
            
            // Recursively add directory contents
            add_directory_to_zip(zip, &path, base_path)?;
        } else {
            // Add file
            let mut file = fs::File::open(&path)?;
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer)?;
            
            zip.start_file(relative_path.to_string_lossy(), options)?;
            zip.write_all(&buffer)?;
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn create_backup(include_images: bool) -> Result<String, String> {
    debug_output(|| {
        println!("Creating backup with include_images: {}", include_images);
    });

    let data_dir = get_data_dir();
    let backup_filename = get_backup_filename();
    let backup_path = data_dir.join(&backup_filename);

    debug_output(|| {
        println!("Data directory: {}", data_dir.display());
        println!("Backup will be created at: {}", backup_path.display());
    });

    // Database file path - use the actual database path which handles debug/release naming
    let db_path_str = get_db_path();
    let db_path = PathBuf::from(&db_path_str);

    debug_output(|| {
        println!("Looking for database file at: {}", db_path_str);
        println!("Database file exists: {}", db_path.exists());
    });

    if !db_path.exists() {
        return Err(format!("Database file not found at: {}", db_path_str));
    }

    // Create zip file
    let file = fs::File::create(&backup_path)
        .map_err(|e| format!("Failed to create backup file: {}", e))?;
    let mut zip = ZipWriter::new(file);

    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o644);

    // Add database file
    let mut db_file = fs::File::open(&db_path)
        .map_err(|e| format!("Failed to open database file: {}", e))?;
    let mut db_buffer = Vec::new();
    db_file.read_to_end(&mut db_buffer)
        .map_err(|e| format!("Failed to read database file: {}", e))?;
    
    // Get just the filename for the zip entry
    let db_filename = db_path.file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("pastebar-db.data");
    
    zip.start_file(db_filename, options)
        .map_err(|e| format!("Failed to start database file in zip: {}", e))?;
    zip.write_all(&db_buffer)
        .map_err(|e| format!("Failed to write database to zip: {}", e))?;

    // Add image directories if requested
    if include_images {
        let clip_images_dir = get_clip_images_dir();
        let history_images_dir = get_clipboard_images_dir();

        debug_output(|| {
            println!("Clip images directory: {}", clip_images_dir.display());
            println!("Clip images exists: {}", clip_images_dir.exists());
            println!("History images directory: {}", history_images_dir.display());
            println!("History images exists: {}", history_images_dir.exists());
        });

        if clip_images_dir.exists() {
            add_directory_to_zip(&mut zip, &clip_images_dir, &data_dir)
                .map_err(|e| format!("Failed to add clip-images directory: {}", e))?;
        }

        if history_images_dir.exists() {
            add_directory_to_zip(&mut zip, &history_images_dir, &data_dir)
                .map_err(|e| format!("Failed to add clipboard-images directory: {}", e))?;
        }
    }

    zip.finish()
        .map_err(|e| format!("Failed to finalize zip file: {}", e))?;

    debug_output(|| {
        println!("Backup created successfully: {}", backup_path.display());
    });

    Ok(backup_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn list_backups() -> Result<BackupListResponse, String> {
    let data_dir = get_data_dir();
    let mut backups = Vec::new();
    let mut total_size = 0u64;

    if let Ok(entries) = fs::read_dir(&data_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if let Some(filename) = path.file_name() {
                    let filename_str = filename.to_string_lossy();
                    if filename_str.starts_with("pastebar-data-backup-") && filename_str.ends_with(".zip") {
                        if let Ok(metadata) = entry.metadata() {
                            let size = metadata.len();
                            total_size += size;

                            // Parse date from filename
                            let created_date = if let Some(date_part) = filename_str
                                .strip_prefix("pastebar-data-backup-")
                                .and_then(|s| s.strip_suffix(".zip"))
                            {
                                // Format: YYYY-MM-DD-HH-MM
                                if let Ok(parsed_date) = DateTime::parse_from_str(
                                    &format!("{} +0000", date_part.replace('-', " ").replacen(' ', "-", 2).replacen(' ', "-", 1).replacen(' ', ":", 1)),
                                    "%Y-%m-%d-%H-%M %z"
                                ) {
                                    parsed_date.format("%B %d, %Y at %I:%M %p").to_string()
                                } else {
                                    "Unknown date".to_string()
                                }
                            } else {
                                "Unknown date".to_string()
                            };

                            backups.push(BackupInfo {
                                filename: filename_str.to_string(),
                                full_path: path.to_string_lossy().to_string(),
                                created_date,
                                size,
                                size_formatted: format_file_size(size),
                            });
                        }
                    }
                }
            }
        }
    }

    // Sort by filename (which includes date) in descending order
    backups.sort_by(|a, b| b.filename.cmp(&a.filename));

    Ok(BackupListResponse {
        backups,
        total_size,
        total_size_formatted: format_file_size(total_size),
    })
}


#[tauri::command]
pub async fn restore_backup(backup_path: String, create_pre_restore_backup: bool) -> Result<String, String> {
    debug_output(|| {
        println!("Restoring backup from: {}", backup_path);
    });

    // Basic validation - check if file exists and is a zip
    let backup_file = Path::new(&backup_path);
    if !backup_file.exists() {
        return Err("Backup file does not exist".to_string());
    }
    if !backup_file.extension().map_or(false, |ext| ext == "zip") {
        return Err("Backup file must be a zip file".to_string());
    }

    let data_dir = get_data_dir();
    
    // Optionally create backup of current data before restore
    if create_pre_restore_backup {
        if let Err(e) = create_backup(true).await {
            debug_output(|| {
                println!("Warning: Could not create pre-restore backup: {}", e);
            });
        } else {
            debug_output(|| {
                println!("Created pre-restore backup");
            });
        }
    } else {
        debug_output(|| {
            println!("Skipping pre-restore backup as requested");
        });
    }

    // Open the backup zip file
    let file = fs::File::open(&backup_path)
        .map_err(|e| format!("Failed to open backup file: {}", e))?;
    
    let mut archive = ZipArchive::new(file)
        .map_err(|e| format!("Failed to read backup file: {}", e))?;

    // Extract files
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Failed to read file from backup: {}", e))?;
        
        let outpath = data_dir.join(file.name());
        
        if file.name().ends_with('/') {
            // Directory
            fs::create_dir_all(&outpath)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        } else {
            // File
            if let Some(parent) = outpath.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create parent directory: {}", e))?;
            }
            
            let mut outfile = fs::File::create(&outpath)
                .map_err(|e| format!("Failed to create file: {}", e))?;
            
            std::io::copy(&mut file, &mut outfile)
                .map_err(|e| format!("Failed to extract file: {}", e))?;
        }
    }

    debug_output(|| {
        println!("Backup restored successfully from: {}", backup_path);
    });

    Ok("Backup restored successfully".to_string())
}

#[tauri::command]
pub async fn delete_backup(backup_path: String) -> Result<String, String> {
    let path = Path::new(&backup_path);
    
    if !path.exists() {
        return Err("Backup file does not exist".to_string());
    }

    // Validate it's actually a backup file
    if let Some(filename) = path.file_name() {
        let filename_str = filename.to_string_lossy();
        if !filename_str.starts_with("pastebar-data-backup-") || !filename_str.ends_with(".zip") {
            return Err("File is not a valid backup file".to_string());
        }
    } else {
        return Err("Invalid file path".to_string());
    }

    fs::remove_file(path)
        .map_err(|e| format!("Failed to delete backup file: {}", e))?;

    debug_output(|| {
        println!("Backup deleted successfully: {}", backup_path);
    });

    Ok("Backup deleted successfully".to_string())
}

#[tauri::command]
pub async fn get_data_paths() -> Result<serde_json::Value, String> {
    let data_dir = get_data_dir();
    
    Ok(serde_json::json!({
        "data_dir": data_dir.to_string_lossy(),
        "database_file": if cfg!(debug_assertions) { "local.pastebar-db.data" } else { "pastebar-db.data" },
        "clip_images_dir": data_dir.join("clip-images").to_string_lossy(),
        "history_images_dir": data_dir.join("history-images").to_string_lossy()
    }))
}