use std::thread;

use bcrypt::{hash, verify, DEFAULT_COST};
use image::Delay;
use keyring::Entry;

#[tauri::command]
pub fn hash_password(password: &str) -> Result<String, String> {
  hash(password, DEFAULT_COST).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn store_os_password(name: &str, password: &str) -> Result<(), String> {
  let entry = Entry::new("PasteBar Application", name).map_err(|e| e.to_string())?;
  let hashed_password = hash(password, DEFAULT_COST).map_err(|e| e.to_string())?;
  entry
    .set_password(&hashed_password)
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_stored_os_password(name: &str) -> Result<String, String> {
  let entry = Entry::new("PasteBar Application", name).map_err(|e| e.to_string())?;
  entry.get_password().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn verify_os_password(name: &str, password: &str) -> Result<bool, String> {
  let entry = Entry::new("PasteBar Application", name).map_err(|e| e.to_string())?;
  let stored_password = entry.get_password().map_err(|e| e.to_string())?;
  thread::sleep(std::time::Duration::from_secs(2) as std::time::Duration);
  verify(password, &stored_password).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_os_password(name: &str) -> Result<bool, String> {
  let entry = Entry::new("PasteBar Application", name).map_err(|e| e.to_string())?;
  let _ = entry.delete_password().map_err(|e| e.to_string());
  Ok(true)
}

#[tauri::command]
pub fn verify_password(password: &str, hash: &str) -> Result<bool, String> {
  verify(password, hash).map_err(|e| e.to_string())
}
