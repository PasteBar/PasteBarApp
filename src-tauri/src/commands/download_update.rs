use opener;
use std::{
  env,
  fs::File,
  io::{self},
};

use reqwest::Client;

#[derive(serde::Deserialize)]
struct UpdateInfo {
  filename: String,
  ok: bool,
  asset: String,
}

#[tauri::command(async)]
pub async fn download_and_execute() -> Result<String, String> {
  let client = Client::new();
  let updater_endpoint = "http://localhost:8787/latest/{{platform}}/{{arch}}"; // Replace with your update URL

  let platform = if cfg!(target_os = "windows") {
    "windows".to_string()
  } else if cfg!(target_os = "macos") {
    "mac".to_string()
  } else {
    return Err("Unsupported platform".into());
  };

  let arch = std::env::consts::ARCH.to_string();

  let update_endpoint = updater_endpoint
    .replace("{{platform}}", &platform)
    .replace("{{arch}}", &arch);

  let response = client
    .get(&update_endpoint)
    .send()
    .await
    .map_err(|e| e.to_string())?;
  if !response.status().is_success() {
    return Err(format!(
      "Failed to fetch update info: {}",
      response.status()
    ));
  }

  let update_info: UpdateInfo = response.json().await.map_err(|e| e.to_string())?;

  if update_info.asset.is_empty() || !update_info.ok {
    return Err("No updates available".into());
  }

  let download_url = update_info.asset.clone();
  let download_filename = update_info.filename.clone();

  let download_path = env::temp_dir();
  let file_path = download_path.join(&download_filename);

  let mut file = match File::create(&file_path) {
    Ok(file) => file,
    Err(e) => {
      println!("Failed to create file at {:?}: {}", file_path, e);
      return Err(e.to_string());
    }
  };

  let response = client
    .get(&download_url)
    .send()
    .await
    .map_err(|e| e.to_string())?;
  if !response.status().is_success() {
    return Err(format!("Failed to download file: {}", response.status()));
  }

  let mut content = io::Cursor::new(response.bytes().await.map_err(|e| e.to_string())?);
  io::copy(&mut content, &mut file).map_err(|e| e.to_string())?;

  let _ = opener::open(file_path).map_err(|e| format!("Failed to open path: {}", e));

  Ok("ok".to_string())
}
