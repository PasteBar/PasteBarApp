use std::path::Path;

use crate::models::models::LinkMetadata;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

use crate::services::link_metadata_service::{
  self, check_audio_file, check_local_audio_file, delete_link_metadata_by_history_id,
  delete_link_metadata_by_item_id, insert_or_update_link_metadata, AudioInfo,
};

use crate::services::utils::{decode_html_entities, ensure_url_prefix};

use nanoid::nanoid;
use reqwest::header::{HeaderMap, USER_AGENT};
use reqwest::Client;
use reqwest::StatusCode;
use url::Url;

use chrono::Local;
use reqwest;
use tauri::api::dialog::blocking::FileDialogBuilder;

#[tauri::command(async)]
pub async fn download_audio(url_or_path: String) -> Result<String, String> {
  let current_datetime = Local::now().format("%Y-%m-%d-%H%M%S");

  let file_name: String;
  let audio_data: Vec<u8>;

  let path = Path::new(&url_or_path);
  if path.exists() {
    file_name = path
      .file_name()
      .and_then(|name| name.to_str())
      .map(String::from)
      .unwrap_or_else(|| format!("audio_{}.mp3", current_datetime));

    audio_data = std::fs::read(path).map_err(|e| e.to_string())?;
  } else {
    let parsed_url = Url::parse(&url_or_path).map_err(|e| e.to_string())?;
    file_name = parsed_url
      .path_segments()
      .and_then(|segments| segments.last())
      .and_then(|name| {
        if name.is_empty() {
          None
        } else {
          Some(name.to_string())
        }
      })
      .unwrap_or_else(|| format!("audio_{}.mp3", current_datetime));

    let response = reqwest::get(&url_or_path)
      .await
      .map_err(|e| e.to_string())?;
    audio_data = response.bytes().await.map_err(|e| e.to_string())?.to_vec();
  }

  let destination_path = FileDialogBuilder::new()
    .set_file_name(&file_name)
    .save_file();

  if let Some(path) = destination_path {
    // Save the audio file
    std::fs::write(&path, audio_data).map_err(|e| e.to_string())?;
    Ok("saved".to_string())
  } else {
    Ok("cancel".to_string())
  }
}

#[tauri::command(async)]
pub async fn validate_audio(url_or_path: String) -> Result<AudioInfo, String> {
  check_audio_file(&url_or_path)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command(async)]
pub async fn fetch_path_metadata(
  file_path: String,
  item_id: String,
  force_update: Option<bool>,
) -> Result<LinkMetadata, String> {
  let force_update = force_update.unwrap_or(false);

  // println!("force_update metadata for file: {}", force_update);
  // println!("item_id: {}", item_id);

  if !force_update {
    if let Some(existing_metadata) = get_link_metadata_by_item_id(item_id.clone()) {
      return Ok(existing_metadata);
    }
  }

  if !file_path.to_lowercase().ends_with(".mp3") {
    return Err("The file is not an MP3".to_string());
  }

  let path = Path::new(&file_path);
  if !path.exists() {
    return Err("File does not exist".to_string());
  }

  let audio_info = check_local_audio_file(&file_path)
    .await
    .map_err(|e| format!("Failed to read MP3 file: {}", e))?;

  if !audio_info.is_valid {
    return Err(
      audio_info
        .error
        .unwrap_or_else(|| "Invalid audio file".to_string()),
    );
  }

  let metadata = LinkMetadata {
    metadata_id: nanoid!(),
    item_id: Some(item_id),
    history_id: None,
    link_domain: None,
    link_url: Some(file_path),
    link_title: audio_info.title.clone(),
    link_favicon: None,
    link_description: None,
    link_image: None,
    link_track_album: audio_info.album,
    link_track_artist: audio_info.artist,
    link_track_title: audio_info.title,
    link_track_year: audio_info.year,
    link_is_track: Some(true),
  };

  insert_or_update_link_metadata(&metadata)
    .map_err(|e| format!("Failed to save link metadata: {:?}", e))?;

  Ok(metadata)
}

#[tauri::command(async)]
pub async fn fetch_link_metadata(
  url: String,
  history_id: Option<String>,
  item_id: Option<String>,
  is_preview_only: Option<bool>,
) -> Result<LinkMetadata, String> {
  if url.is_empty() {
    return Err("URL is empty".to_string());
  }

  if history_id.is_none() && item_id.is_none() {
    return Err("History ID or Item ID is required".to_string());
  }

  let custom_user_agent: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.1";

  let mut headers = HeaderMap::new();
  headers.insert(
    USER_AGENT,
    custom_user_agent
      .parse::<reqwest::header::HeaderValue>()
      .map_err(|e| e.to_string())?,
  );

  let parsed_url = Url::parse(&url).map_err(|e| e.to_string())?;
  let domain = parsed_url
    .domain()
    .ok_or_else(|| "Domain could not be extracted from URL".to_string())?;
  let favicon_url = format!("https://www.google.com/s2/favicons?domain={}&sz=32", domain);

  let favicon_response = reqwest::get(&favicon_url)
    .await
    .map_err(|e| e.to_string())?;

  let favicon_data_url = if favicon_response.status() != StatusCode::NOT_FOUND {
    let favicon_bytes = favicon_response.bytes().await.map_err(|e| e.to_string())?;
    Some(format!(
      "data:image/png;base64,{}",
      base64::encode(favicon_bytes)
    ))
  } else {
    None
  };

  let client = Client::builder()
    .redirect(reqwest::redirect::Policy::limited(6))
    .build()
    .map_err(|e| e.to_string())?;

  // Check if the URL ends with .mp3
  let mut link_track_album = None;
  let mut link_track_artist = None;
  let mut link_track_title = None;
  let mut link_track_year = None;
  let mut link_is_track = None;

  if url.ends_with(".mp3") {
    match check_audio_file(&url).await {
      Ok(audio_info) => {
        link_track_album = audio_info.album;
        link_track_artist = audio_info.artist;
        link_track_title = audio_info.title;
        link_track_year = audio_info.year;
        link_is_track = Some(true);
      }
      Err(e) => {
        println!("Error checking audio file: {:?}", e);
      }
    }
  }

  let response = client
    .get(&url)
    .headers(headers.clone())
    .send()
    .await
    .map_err(|e| e.to_string())?
    .text()
    .await
    .map_err(|e| e.to_string())?;

  let metadata = extract_metadata(&response, &domain)?;

  let mut title = metadata.title.clone();

  if title.is_none() || title.as_deref().unwrap_or("").is_empty() {
    let root_url = format!("https://{}", domain);

    let root_response = client
      .get(&root_url)
      .headers(headers)
      .send()
      .await
      .map_err(|e| e.to_string())?
      .text()
      .await
      .map_err(|e| e.to_string())?;

    let root_metadata = extract_metadata(&root_response, &domain)?;
    title = root_metadata.title;
  }

  let meta = LinkMetadata {
    metadata_id: nanoid!(),
    item_id: item_id.clone(),
    history_id: history_id.clone(),
    link_domain: Some(domain.to_string()),
    link_url: Some(url),
    link_title: if title.is_some() {
      title.map(|t| decode_html_entities(&t))
    } else {
      Some(domain.to_string())
    },
    link_favicon: favicon_data_url,
    link_description: metadata.description.map(|d| decode_html_entities(&d)),
    link_image: metadata.image.clone(),
    link_track_album,
    link_track_artist,
    link_track_title,
    link_track_year,
    link_is_track,
  };

  if is_preview_only != Some(true) {
    insert_or_update_link_metadata(&meta)
      .map_err(|e| format!("Failed to save link metadata: {:?}", e))?;
  }

  Ok(meta)
}

fn extract_metadata(html: &str, domain: &str) -> Result<Metadata, String> {
  let document = Html::parse_document(html);
  let title_selector = Selector::parse("title").map_err(|e| e.to_string())?;
  let description_selector =
    Selector::parse("meta[name=description]").map_err(|e| e.to_string())?;
  let og_image_selector =
    Selector::parse("meta[property='og:image']").map_err(|e| e.to_string())?;
  let og_image_secure_selector =
    Selector::parse("meta[property='og:image:secure_url']").map_err(|e| e.to_string())?;
  let twitter_image_selector =
    Selector::parse("meta[name='twitter:image']").map_err(|e| e.to_string())?;
  let first_image_selector = Selector::parse("img").map_err(|e| e.to_string())?;

  let title = document
    .select(&title_selector)
    .next()
    .map(|e| e.inner_html());
  let description = document
    .select(&description_selector)
    .next()
    .and_then(|e| e.value().attr("content").map(String::from));

  let og_image = document
    .select(&og_image_selector)
    .next()
    .and_then(|e| e.value().attr("content").map(String::from));
  let og_image_secure = document
    .select(&og_image_secure_selector)
    .next()
    .and_then(|e| e.value().attr("content").map(String::from));
  let twitter_image = document
    .select(&twitter_image_selector)
    .next()
    .and_then(|e| e.value().attr("content").map(String::from));
  let first_image = document
    .select(&first_image_selector)
    .next()
    .and_then(|e| e.value().attr("src").map(String::from));

  let image = og_image
    .or(og_image_secure)
    .or(twitter_image)
    .or(first_image)
    .map(|img| fix_image_url(&img, domain));

  Ok(Metadata {
    title,
    description,
    image,
  })
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Metadata {
  title: Option<String>,
  description: Option<String>,
  image: Option<String>,
}

#[tauri::command]
pub fn get_link_metadata_by_item_id(item_id: String) -> Option<LinkMetadata> {
  link_metadata_service::get_link_metadata_by_item_id(item_id)
}

#[tauri::command]
pub fn copy_link_metadata_to_new_item_id(
  metadata_id: String,
  item_id: String,
) -> Option<LinkMetadata> {
  link_metadata_service::copy_link_metadata_to_new_item_id(metadata_id, item_id)
}

#[tauri::command]
pub fn delete_link_metadata(history_id: Option<String>, item_id: Option<String>) -> String {
  if history_id.is_none() && item_id.is_none() {
    return "History ID or Item ID is required".to_string();
  }

  if let Some(_history_id) = history_id {
    delete_link_metadata_by_history_id(_history_id);
  }

  if let Some(_item_id) = item_id {
    delete_link_metadata_by_item_id(_item_id);
  }

  "ok".to_string()
}

fn fix_image_url(image_url: &str, domain: &str) -> String {
  let domain_url = ensure_url_prefix(domain);
  if let Ok(parsed_url) = Url::parse(&image_url) {
    if parsed_url.has_host() {
      return image_url.to_string();
    }
  }

  if image_url.starts_with('/') {
    format!("{}{}", domain_url.trim_end_matches('/'), image_url)
  } else {
    format!(
      "{}/{}",
      domain_url.trim_end_matches('/'),
      image_url.trim_start_matches('/')
    )
  }
}
