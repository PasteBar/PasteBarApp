use std::path::Path;
use std::time::Duration;

use crate::models::models::LinkMetadata;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

use crate::services::link_metadata_service::{
  self, check_audio_file, check_local_audio_file, delete_link_metadata_by_history_id,
  delete_link_metadata_by_item_id, insert_or_update_link_metadata, AudioInfo,
};

use crate::services::utils::{debug_output, decode_html_entities, ensure_url_prefix};
use linkify::{LinkFinder, LinkKind};

use nanoid::nanoid;
use reqwest::header::{HeaderMap, USER_AGENT};
use reqwest::Client;
use reqwest::StatusCode;
use std::net::ToSocketAddrs;
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
pub async fn fetch_link_track_metadata(
  url: String,
  preview_metadata: Option<LinkMetadata>,
  item_id: Option<String>,
  history_id: Option<String>,
  is_preview_only: Option<bool>,
) -> Result<LinkMetadata, String> {
  if url.is_empty() {
    return Err("URL is empty".to_string());
  }

  let is_preview_only = is_preview_only.unwrap_or(false);

  if item_id.is_none() && history_id.is_none() && !is_preview_only {
    return Err("Item ID or History ID is required".to_string());
  }

  let mut existing_metadata: Option<LinkMetadata> = preview_metadata;

  if let Some(id) = item_id.clone() {
    existing_metadata = link_metadata_service::get_link_metadata_by_item_id(id);
  }

  if existing_metadata.is_none() {
    if let Some(id) = history_id.clone() {
      existing_metadata = link_metadata_service::get_link_metadata_by_history_id(id);
    }
  }

  if existing_metadata.is_none() && !is_preview_only {
    return Err("No existing metadata found for the provided item ID or history ID".to_string());
  }

  let mut metadata = existing_metadata.unwrap_or_else(|| LinkMetadata {
    metadata_id: nanoid!(),
    item_id: item_id.clone(),
    history_id: history_id.clone(),
    link_domain: None,
    link_url: Some(url.clone()),
    link_title: None,
    link_favicon: None,
    link_description: None,
    link_image: None,
    link_track_album: None,
    link_track_artist: None,
    link_track_title: None,
    link_track_year: None,
    link_is_track: None,
  });

  let fixed_url = fix_url(&url);

  if !fixed_url.ends_with(".mp3") {
    return Err("The URL is not an MP3 file".to_string());
  }

  let mut audio_info = match check_audio_file(&fixed_url).await {
    Ok(audio_info) => audio_info,
    Err(e) => {
      println!("Error checking audio file: {:?}", e);
      return Err("Failed to fetch MP3 metadata".to_string());
    }
  };

  if audio_info.title.is_none() {
    let parsed_url = Url::parse(&fixed_url).map_err(|e| e.to_string())?;
    let path = parsed_url.path();
    let title_from_path = path
      .split('/')
      .last()
      .unwrap_or("")
      .replace(".mp3", "")
      .replace('_', " ")
      .replace('-', " ")
      .split_whitespace()
      .map(|s| {
        let mut c = s.chars();
        match c.next() {
          Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
          None => String::new(),
        }
      })
      .collect::<Vec<String>>()
      .join(" ");

    audio_info.title = Some(title_from_path);
  }

  metadata.link_track_album = audio_info.album;
  metadata.link_track_artist = audio_info.artist;
  metadata.link_track_title = audio_info.title.clone();
  metadata.link_track_year = audio_info.year;
  metadata.link_is_track = Some(true);

  if !is_preview_only {
    insert_or_update_link_metadata(&metadata)
      .map_err(|e| format!("Failed to save link metadata: {:?}", e))?;
  }

  Ok(metadata)
}

#[tauri::command(async)]
pub async fn fetch_link_metadata(
  url: String,
  history_id: Option<String>,
  item_id: Option<String>,
  is_preview_only: Option<bool>,
) -> Result<LinkMetadata, String> {
  debug_output(|| {
    println!("Fetching metadata for URL: {}", url);
  });
  if url.is_empty() {
    return Err("URL is empty".to_string());
  }

  if history_id.is_none() && item_id.is_none() {
    return Err("History ID or Item ID is required".to_string());
  }

  if let Some(id) = item_id.clone() {
    if let Some(metadata) = link_metadata_service::get_link_metadata_by_item_id(id) {
      return Ok(metadata);
    }
  }

  if let Some(id) = history_id.clone() {
    if let Some(metadata) = link_metadata_service::get_link_metadata_by_history_id(id) {
      return Ok(metadata);
    }
  }

  let custom_user_agent: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.1";

  let mut headers = HeaderMap::new();

  headers.insert(
    USER_AGENT,
    custom_user_agent
      .parse::<reqwest::header::HeaderValue>()
      .map_err(|e| e.to_string())?,
  );

  let client = Client::builder()
    .timeout(Duration::from_secs(12))
    .redirect(reqwest::redirect::Policy::limited(6))
    .build()
    .map_err(|e| e.to_string())?;

  let mut error_status = None;

  let parsed_url = Url::parse(&url).map_err(|e| e.to_string())?;
  let domain = parsed_url
    .domain()
    .ok_or_else(|| "Domain could not be extracted from URL".to_string())?;

  if (domain, 80).to_socket_addrs().is_err() {
    return Err("Domain does not exist".to_string());
  }

  let fix_url = fix_url(&url);

  let response = match client.get(&fix_url).headers(headers.clone()).send().await {
    Ok(result) => {
      if result.status().is_success() {
        result
      } else {
        println!("HTTP Error: {}", result.status());
        return Err(format!("HTTP Error: {}", result.status()));
      }
    }
    Err(_) => {
      println!("Request timed out");
      return Err("Request timed out".to_string());
    }
  };

  let status = response.status();

  if !status.is_success() {
    return Err(format!("HTTP Error: {}", status));
  }

  let parsed_url = Url::parse(&fix_url).map_err(|e| e.to_string())?;
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

  let link_track_album = None;
  let link_track_artist = None;
  let link_track_title = None;
  let link_track_year = None;
  let link_is_track = None;

  let response_text = response.text().await.map_err(|e| {
    error_status = Some(500);
    e.to_string()
  })?;

  let mut metadata = extract_metadata(&response_text, &domain)?;

  // Check if we need to make a second request to the root URL
  if metadata.title.is_none() || metadata.title.as_deref().unwrap_or("").is_empty() {
    let root_url = format!("https://{}", domain);

    match client.get(&root_url).headers(headers).send().await {
      Ok(root_response) => {
        if root_response.status().is_success() {
          if let Ok(root_text) = root_response.text().await {
            if let Ok(root_metadata) = extract_metadata(&root_text, &domain) {
              metadata = root_metadata;
            }
          }
        }
      }
      Err(_) => {
        // Log the error, but continue with the original metadata
        println!("Failed to fetch root URL");
      }
    }
  }

  // If we still don't have a title, use a default or error message
  if metadata.title.is_none() || metadata.title.as_deref().unwrap_or("").is_empty() {
    metadata.title = Some(match error_status {
      Some(404) => "Error 404 - Not Found".to_string(),
      Some(500) => "Error 500 - Server Error".to_string(),
      Some(status) => format!("Error {} - Unknown Error", status),
      None => "Error - Unable to fetch title".to_string(),
    });
  }

  let meta = LinkMetadata {
    metadata_id: nanoid!(),
    item_id: item_id.clone(),
    history_id: history_id.clone(),
    link_domain: Some(domain.to_string()),
    link_url: Some(fix_url),
    link_title: metadata.title.map(|t| decode_html_entities(&t)),
    link_favicon: favicon_data_url,
    link_description: metadata.description.map(|d| decode_html_entities(&d)),
    link_image: metadata.image,
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
  let og_title_selector =
    Selector::parse("meta[property='og:title']").map_err(|e| e.to_string())?;
  let description_selector =
    Selector::parse("meta[name=description]").map_err(|e| e.to_string())?;
  let og_image_selector =
    Selector::parse("meta[property='og:image']").map_err(|e| e.to_string())?;
  let og_image_secure_selector =
    Selector::parse("meta[property='og:image:secure_url']").map_err(|e| e.to_string())?;
  let twitter_image_selector =
    Selector::parse("meta[name='twitter:image']").map_err(|e| e.to_string())?;
  let apple_image_selector =
    Selector::parse("link[rel='apple-touch-icon']").map_err(|e| e.to_string())?;
  let first_image_selector = Selector::parse("img").map_err(|e| e.to_string())?;

  let html_title = document
    .select(&title_selector)
    .next()
    .map(|e| e.inner_html())
    .and_then(|s| if s.trim().is_empty() { None } else { Some(s) });

  let og_title = document
    .select(&og_title_selector)
    .next()
    .and_then(|e| e.value().attr("content").map(String::from))
    .and_then(|s| if s.trim().is_empty() { None } else { Some(s) });

  let description = document
    .select(&description_selector)
    .next()
    .and_then(|e| e.value().attr("content").map(String::from))
    .and_then(|s| if s.trim().is_empty() { None } else { Some(s) });

  let extract_image = |selector: &Selector, attr: &str| {
    document
      .select(selector)
      .next()
      .and_then(|e| e.value().attr(attr).map(String::from))
      .and_then(|s| if s.trim().is_empty() { None } else { Some(s) })
      .map(|s| fix_image_url(&s, domain))
      .and_then(|s| {
        if is_valid_image_url(&s) {
          Some(s)
        } else {
          None
        }
      })
  };

  let og_image = extract_image(&og_image_selector, "content");
  let og_image_secure = extract_image(&og_image_secure_selector, "content");
  let twitter_image = extract_image(&twitter_image_selector, "content");
  let apple_image = extract_image(&apple_image_selector, "href");
  let first_image = extract_image(&first_image_selector, "src");

  let image = og_image
    .or(og_image_secure)
    .or(twitter_image)
    .or(apple_image)
    .or(first_image);

  let title = og_title.or(html_title);

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
  if image_url.starts_with("//") {
    return format!("https:{}", image_url);
  }

  if image_url.starts_with("http://") || image_url.starts_with("https://") {
    return image_url.to_string();
  }

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

fn is_valid_image_url(url: &str) -> bool {
  let valid_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

  if let Ok(parsed_url) = Url::parse(url) {
    if let Some(path) = parsed_url
      .path_segments()
      .and_then(|segments| segments.last())
    {
      let lower_path = path.to_lowercase();
      return valid_extensions
        .iter()
        .any(|&ext| lower_path.ends_with(ext));
    }
  }

  // Fallback for cases where URL parsing fails
  let lower_url = url.to_lowercase();
  valid_extensions.iter().any(|&ext| lower_url.contains(ext))
}

pub fn fix_url(input: &str) -> String {
  let finder = LinkFinder::new();
  let links: Vec<_> = finder
    .links(input)
    .filter(|link| link.kind() == &LinkKind::Url)
    .collect();

  if let Some(link) = links.first() {
    let url = link.as_str().trim();

    // Check if URL starts with common schemes
    if url.starts_with("http://") || url.starts_with("https://") {
      return url.to_string();
    }

    // Remove leading "//"
    if url.starts_with("//") {
      return format!("https:{}", &url[2..]);
    }

    // Fix common URL mistakes
    if url.starts_with("://") {
      return format!("https{}", url);
    }

    if url.starts_with(':') {
      return format!("https:{}", &url[1..]);
    }

    // Ensure the URL starts with a scheme
    return format!("https://{}", url);
  }

  // If no URLs found, return the input as-is
  input.to_string()
}
