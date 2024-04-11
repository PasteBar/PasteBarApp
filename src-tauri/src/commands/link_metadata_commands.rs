use crate::metadata::MetaScraper;
use crate::models::models::LinkMetadata;
use crate::services::link_metadata_service::{
  self, delete_link_metadata_by_history_id, delete_link_metadata_by_item_id,
  insert_or_update_link_metadata,
};

use crate::services::utils::decode_html_entities;

use nanoid::nanoid;
use reqwest::header::{HeaderMap, USER_AGENT};
use reqwest::{redirect::Policy, Client};
use url::Url;

use http_cache_mokadeser::MokaManager;
use http_cache_reqwest::{Cache, CacheMode, HttpCache, HttpCacheOptions};

use reqwest_middleware::ClientBuilder;

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

  let custom_user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.1";

  let mut headers = HeaderMap::new();
  headers.insert(USER_AGENT, custom_user_agent.parse().unwrap());

  let parsed_url = Url::parse(&url).map_err(|e| e.to_string())?;
  let domain = parsed_url
    .domain()
    .ok_or_else(|| "Domain could not be extracted from URL".to_string())?;
  let favicon_url = format!(
    "https://www.google.com/s2/favicons?domain={}&size=32",
    domain
  );

  let favicon_response = reqwest::get(&favicon_url)
    .await
    .map_err(|e| e.to_string())?;
  let favicon_bytes = favicon_response.bytes().await.map_err(|e| e.to_string())?;
  let favicon_data_url = format!("data:image/png;base64,{}", base64::encode(favicon_bytes));

  let client_base = Client::builder()
    .redirect(Policy::limited(6))
    .build()
    .map_err(|e| e.to_string())?;

  let client = ClientBuilder::new(client_base)
    .with(Cache(HttpCache {
      mode: CacheMode::Default,
      manager: MokaManager::default(),
      options: HttpCacheOptions::default(),
    }))
    .build();

  let response = client
    .get(&url)
    .headers(headers)
    .send()
    .await
    .map_err(|e| e.to_string())?
    .text()
    .await
    .map_err(|e| e.to_string())?;

  let metascraper = MetaScraper::parse(&response).map_err(|e| e.to_string())?;
  let metadata = metascraper.metadata();

  let meta = LinkMetadata {
    metadata_id: nanoid!(),
    item_id: item_id.clone(),
    history_id: history_id.clone(),
    link_domain: Some(domain.to_string()),
    link_url: Some(url),
    link_title: if metadata.title.is_some() {
      metadata.title.as_deref().map(decode_html_entities)
    } else {
      Some(domain.to_string())
    },
    link_favicon: Some(favicon_data_url),
    link_description: metadata.description.as_deref().map(decode_html_entities),
    link_image: metadata.image.clone(),
  };

  if is_preview_only != Some(true) {
    insert_or_update_link_metadata(&meta)
      .map_err(|e| format!("Failed to save link metadata: {:?}", e))?;
  }

  Ok(meta)
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
