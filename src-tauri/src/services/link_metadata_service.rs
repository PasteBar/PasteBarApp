use crate::{
  db::establish_pool_db_connection, models::models::LinkMetadata, schema::link_metadata::dsl::*,
};

use diesel::prelude::*;
use id3::{Tag, TagLike}; // Note the addition of TagLike here
use mime_guess::from_path;
use nanoid::nanoid;
use reqwest::header::{CONTENT_LENGTH, RANGE};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{Cursor, Read};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct AudioInfo {
  pub is_valid: bool,
  pub title: Option<String>,
  pub error: Option<String>,
  pub src: String,
  pub album: Option<String>,
  pub year: Option<String>,
  pub artist: Option<String>,
}

pub async fn check_audio_file(url_or_path: &str) -> Result<AudioInfo, Box<dyn std::error::Error>> {
  if Path::new(url_or_path).exists() {
    check_local_audio_file(url_or_path).await
  } else {
    check_url_audio_file(url_or_path).await
  }
}

pub async fn check_local_audio_file(path: &str) -> Result<AudioInfo, Box<dyn std::error::Error>> {
  let path = Path::new(path);

  if !is_valid_audio_file_extension(path) {
    return Ok(AudioInfo {
      is_valid: false,
      title: None,
      album: None,
      year: None,
      src: path.to_string_lossy().to_string(),
      error: Some("Invalid file type".to_string()),
      artist: None,
    });
  }

  let mut file = File::open(path)?;
  let mut buffer = Vec::new();
  file.read_to_end(&mut buffer)?;

  // Try to read ID3 tags
  match Tag::read_from2(std::io::Cursor::new(&buffer)) {
    Ok(tag) => Ok(extract_tag_info(tag, path.to_string_lossy().to_string())),
    Err(_) => Ok(AudioInfo {
      is_valid: true,
      title: None,
      year: None,
      src: path.to_string_lossy().to_string(),
      artist: None,
      album: None,
      error: None,
    }),
  }
}

fn extract_tag_info(tag: Tag, src: String) -> AudioInfo {
  AudioInfo {
    is_valid: true,
    title: tag.title().map(String::from),
    album: tag.album().map(String::from),
    src,
    error: None,
    year: tag.year().map(|year| year.to_string()),
    artist: tag.artist().map(String::from),
  }
}

fn is_valid_audio_file_extension(path: &Path) -> bool {
  if let Some(extension) = path.extension() {
    let extension = extension.to_str().unwrap_or("").to_lowercase();
    return matches!(extension.as_str(), "mp3" | "wav" | "ogg" | "flac");
  }
  false
}

pub async fn check_url_audio_file(url: &str) -> Result<AudioInfo, Box<dyn std::error::Error>> {
  let mut url = reqwest::Url::parse(url)?;
  let client = reqwest::Client::new();

  // Follow redirects and update URL
  let response = client.get(url.clone()).send().await?;
  url = response.url().clone();

  // Check if the final URL is HTTPS
  if url.scheme() != "https" {
    return Ok(AudioInfo {
      is_valid: false,
      title: None,
      album: None,
      src: url.to_string(),
      year: None,
      error: Some("URL is not HTTPS".to_string()),
      artist: None,
    });
  }

  // File extension and MIME type checks
  if !is_valid_audio_file(&url) {
    return Ok(AudioInfo {
      is_valid: false,
      title: None,
      album: None,
      src: url.to_string(),
      year: None,
      error: Some("Invalid file type".to_string()),
      artist: None,
    });
  }

  let client = reqwest::Client::new();

  let content_length = get_content_length(&client, &url).await?;

  // Check for ID3v2 tags (beginning of file)
  let start_bytes = fetch_bytes(&client, &url, "bytes=0-10240").await?;
  if let Ok(tag) = Tag::read_from2(Cursor::new(&start_bytes)) {
    return Ok(extract_tag_info(tag, url.to_string()));
  }

  // Check for ID3v1 tags (end of file)
  if content_length >= 128 {
    let end_range = format!("bytes={}-{}", content_length - 128, content_length - 1);
    let end_bytes = fetch_bytes(&client, &url, &end_range).await?;
    if let Ok(tag) = Tag::read_from2(Cursor::new(&end_bytes)) {
      return Ok(extract_tag_info(tag, url.to_string()));
    }
  }

  // Check for ID3v1 tags in larger chunks from the start
  for &chunk_size in &[1_000, 10_000, 100_000, 200_000, 400_000] {
    let range = format!("bytes=0-{}", chunk_size);
    let bytes = fetch_bytes(&client, &url, &range).await?;
    if let Ok(tag) = Tag::read_from2(Cursor::new(&bytes)) {
      println!("ID3v1 tags found in {} byte chunk", chunk_size);
      return Ok(extract_tag_info(tag, url.to_string()));
    }
  }

  Ok(AudioInfo {
    is_valid: true,
    title: None,
    src: url.to_string(),
    artist: None,
    album: None,
    year: None,
    error: None,
  })
}

pub fn insert_or_update_link_metadata(
  metadata: &LinkMetadata,
) -> Result<String, diesel::result::Error> {
  let connection = &mut establish_pool_db_connection();

  diesel::replace_into(link_metadata)
    .values(metadata)
    .execute(connection)?;

  Ok("ok".to_string())
}

pub fn get_link_metadata_by_item_id(item_id_value: String) -> Option<LinkMetadata> {
  let connection = &mut establish_pool_db_connection();

  link_metadata
    .filter(item_id.eq(item_id_value))
    .first(connection)
    .ok()
}

pub fn get_link_metadata_by_history_id(history_id_value: String) -> Option<LinkMetadata> {
  let connection = &mut establish_pool_db_connection();

  link_metadata
    .filter(history_id.eq(history_id_value))
    .first(connection)
    .ok()
}

pub fn copy_link_metadata_to_new_item_id(
  metadata_id_value: String,
  item_id_value: String,
) -> Option<LinkMetadata> {
  let connection = &mut establish_pool_db_connection();

  let metadata: LinkMetadata = link_metadata
    .filter(metadata_id.eq(metadata_id_value))
    .first(connection)
    .ok()?;

  let new_metadata = LinkMetadata {
    metadata_id: nanoid!(),
    item_id: Some(item_id_value),
    history_id: None,
    link_url: metadata.link_url,
    link_title: metadata.link_title,
    link_description: metadata.link_description,
    link_image: metadata.link_image,
    link_domain: metadata.link_domain,
    link_favicon: metadata.link_favicon,
    link_track_artist: metadata.link_track_artist,
    link_track_title: metadata.link_track_title,
    link_track_album: metadata.link_track_album,
    link_track_year: metadata.link_track_year,
    link_is_track: metadata.link_is_track,
  };

  insert_or_update_link_metadata(&new_metadata).ok()?;

  Some(new_metadata)
}

pub fn delete_link_metadata_by_history_id(history_id_value: String) -> String {
  let connection = &mut establish_pool_db_connection();

  let _ = diesel::delete(link_metadata.filter(history_id.eq(history_id_value))).execute(connection);

  "ok".to_string()
}

pub fn delete_link_metadata_by_item_id(item_id_value: String) -> String {
  let connection = &mut establish_pool_db_connection();

  let _ = diesel::delete(link_metadata.filter(item_id.eq(item_id_value))).execute(connection);

  "ok".to_string()
}

pub fn delete_link_metadata_by_history_ids(history_ids_value: &[String]) -> String {
  let connection = &mut establish_pool_db_connection();

  let _ =
    diesel::delete(link_metadata.filter(history_id.eq_any(history_ids_value))).execute(connection);

  "ok".to_string()
}

pub fn delete_all_link_metadata_with_history_ids() -> String {
  let connection = &mut establish_pool_db_connection();

  let _ = diesel::delete(link_metadata.filter(history_id.is_not_null())).execute(connection);

  "ok".to_string()
}

fn is_valid_audio_file(url: &reqwest::Url) -> bool {
  let path = Path::new(url.path());
  let extension_valid = path.extension().map_or(false, |ext| ext == "mp3");
  let mime = from_path(path).first_or_octet_stream();
  extension_valid && mime.type_() == mime::AUDIO
}

async fn get_content_length(client: &reqwest::Client, url: &reqwest::Url) -> Result<u64, String> {
  let head_resp = match client.head(url.clone()).send().await {
    Ok(resp) => resp,
    Err(e) => return Err(format!("Failed to send HEAD request: {}", e)),
  };

  if !head_resp.status().is_success() {
    return Err(format!(
      "HEAD request failed with status: {}",
      head_resp.status()
    ));
  }

  let content_length = head_resp
    .headers()
    .get(CONTENT_LENGTH)
    .ok_or_else(|| "Content-Length header not found".to_string())?;

  let content_length_str = content_length
    .to_str()
    .map_err(|e| format!("Failed to convert Content-Length to string: {}", e))?;

  content_length_str
    .parse::<u64>()
    .map_err(|e| format!("Failed to parse Content-Length as u64: {}", e))
}

async fn fetch_bytes(
  client: &reqwest::Client,
  url: &reqwest::Url,
  range: &str,
) -> Result<Vec<u8>, String> {
  let resp = client
    .get(url.clone())
    .header(RANGE, range)
    .send()
    .await
    .map_err(|e| e.to_string())?;

  resp
    .bytes()
    .await
    .map(|b| b.to_vec())
    .map_err(|e| e.to_string())
}
