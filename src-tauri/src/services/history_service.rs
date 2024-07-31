use crate::clipboard::LanguageDetectOptions;
use lazy_static::lazy_static;

use crate::db::establish_pool_db_connection;
use crate::models::models::{LinkMetadata, UpdatedHistoryData};
use crate::models::{ClipboardHistory, Setting};
use crate::services::link_metadata_service::{
  delete_all_link_metadata_with_history_ids, delete_link_metadata_by_history_ids,
};
use arboard::ImageData;
use image::GenericImageView;
use linkify::LinkFinder;
use regex::Regex;
use serde_json::to_string;

use base64::{engine::general_purpose, Engine as _};
use chrono::{Duration, NaiveDateTime, Utc};
use std::{collections::HashMap, sync::Mutex};

use diesel::prelude::*;
use diesel::result::Error;
use image::{self, DynamicImage};
use image::{ImageBuffer, RgbaImage};
use lang_detect::detect_language;
use nanoid::nanoid;
use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use std::fs;
use std::path::{Path, PathBuf};

use std::io::Cursor;

use crate::db::APP_CONSTANTS;
use crate::schema::clipboard_history;
use crate::schema::clipboard_history::dsl::*;
use crate::schema::link_metadata;
use crate::schema::link_metadata::dsl::link_metadata as link_metadata_dsl;

use img_hash::{HasherConfig, ImageHash};

use crate::services::utils::{
  debug_output, delete_file_and_maybe_parent, has_emoji, has_valid_tld, is_base64_image,
  is_image_url, is_youtube_url, mask_value, remove_dir_if_exists,
};

use super::utils::is_valid_json;

use diesel::debug_query;
use diesel::sqlite::Sqlite;

type ImageHashSize = [u8; 8];

lazy_static! {
  pub static ref HISTORY_INSERT_COUNT: Mutex<i32> = Mutex::new(0);
}

pub fn increment_history_insert_count() {
  let mut count = HISTORY_INSERT_COUNT.lock().unwrap();
  *count += 1;
}

pub fn reset_history_insert_count() {
  let mut count = HISTORY_INSERT_COUNT.lock().unwrap();
  *count = 0;
}

#[derive(Queryable, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateClipboardHistory {
  pub history_id: String,
  pub title: Option<String>,
  pub value: Option<String>,
  pub is_ignored: Option<bool>,
  pub image_data_low_res: Option<Vec<u8>>,
  pub image_path_full_res: Option<String>,
  pub image_data_url: Option<String>,
  pub image_hash: Option<String>,
  pub is_image: Option<bool>,
  pub is_image_data: Option<bool>,
  pub is_masked: Option<bool>,
  pub has_emoji: Option<bool>,
  pub has_masked_words: Option<bool>,
  pub is_pinned: Option<bool>,
  pub is_favorite: Option<bool>,
  pub value_type_id: Option<String>,
  pub item_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RecentClipboardHistoryData {
  pub history_id: String,
  pub title: Option<String>,
  pub value: Option<String>,
  pub value_preview: Option<String>,
  pub is_image: Option<bool>,
  pub is_link: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardHistoryWithMetaData {
  pub history_id: String,
  pub history_options: Option<String>,
  pub copied_from_app: Option<String>,
  pub title: Option<String>,
  pub value: Option<String>,
  pub value_preview: Option<String>,
  pub value_more_preview_lines: Option<i32>,
  pub value_more_preview_chars: Option<i32>,
  pub value_hash: Option<String>,
  pub is_image: Option<bool>,
  pub image_path_full_res: Option<String>,
  pub image_data_low_res: Option<Vec<u8>>,
  pub image_preview_height: Option<i32>,
  pub image_height: Option<i32>,
  pub image_width: Option<i32>,
  pub image_data_url: Option<String>,
  pub image_hash: Option<String>,
  pub is_image_data: Option<bool>,
  pub is_masked: Option<bool>,
  pub is_text: Option<bool>,
  pub is_code: Option<bool>,
  pub is_link: Option<bool>,
  pub is_video: Option<bool>,
  pub has_emoji: Option<bool>,
  pub has_masked_words: Option<bool>,
  pub is_pinned: Option<bool>,
  pub is_favorite: Option<bool>,
  pub links: Option<String>,
  pub detected_language: Option<String>,
  pub pinned_order_number: Option<i32>,
  pub link_metadata: Option<LinkMetadata>,
  pub created_at: i64,
  pub updated_at: i64,
  pub created_date: NaiveDateTime,
  pub updated_date: NaiveDateTime,
}

impl ClipboardHistoryWithMetaData {
  pub fn from(
    history: ClipboardHistory,
    link_metadata: Option<LinkMetadata>,
    auto_mask_words_list: &Vec<String>,
  ) -> Self {
    // For example:
    let mut history_with_metadata = ClipboardHistoryWithMetaData {
      history_id: history.history_id,
      title: history.title,
      value: history.value,
      value_preview: None,
      value_more_preview_lines: None,
      value_more_preview_chars: None,
      value_hash: history.value_hash,
      is_image: history.is_image,
      image_path_full_res: history.image_path_full_res,
      image_data_low_res: history.image_data_low_res,
      image_preview_height: history.image_preview_height,
      image_height: history.image_height,
      image_width: history.image_width,
      image_data_url: history.image_data_url,
      image_hash: history.image_hash,
      is_image_data: history.is_image_data,
      is_masked: history.is_masked,
      is_text: history.is_text,
      is_code: history.is_code,
      is_link: history.is_link,
      is_video: history.is_video,
      has_emoji: history.has_emoji,
      has_masked_words: history.has_masked_words,
      is_pinned: history.is_pinned,
      is_favorite: history.is_favorite,
      links: history.links,
      detected_language: history.detected_language,
      pinned_order_number: history.pinned_order_number,
      created_at: history.created_at,
      updated_at: history.updated_at,
      created_date: history.created_date,
      updated_date: history.updated_date,
      history_options: history.history_options,
      copied_from_app: history.copied_from_app,
      link_metadata,
    };

    process_history_item(&mut history_with_metadata, auto_mask_words_list);
    history_with_metadata
  }
}

pub fn add_clipboard_history_from_image(
  image_data: ImageData,
  should_auto_star_on_double_copy: bool,
  _copied_from_app: Option<String>,
) -> String {
  let image = match ImageBuffer::from_raw(
    image_data
      .width
      .try_into()
      .expect("Width conversion failed"),
    image_data
      .height
      .try_into()
      .expect("Height conversion failed"),
    image_data.bytes.into_owned(),
  ) {
    Some(image) => image,
    None => {
      eprintln!("Error converting image data to ImageBuffer");
      return "Error converting image data to ImageBuffer".to_string();
    }
  };

  let _history_id = nanoid!().to_string();
  let folder_name = &_history_id[..3];

  let base_dir = if cfg!(debug_assertions) {
    &APP_CONSTANTS.get().unwrap().app_dev_data_dir
  } else {
    &APP_CONSTANTS.get().unwrap().app_data_dir
  };

  let (_image_width, _image_height) = image.dimensions();

  debug_output(|| {
    println!(
      "Full image Width: {}, Full image Height: {}, ",
      _image_width, _image_height
    );
  });

  let resized_img = resize_image_if_necessary(image.clone());
  let (_, _preview_height) = resized_img.dimensions();
  let _image_data_low_res = convert_to_vec_u8(resized_img.clone());
  let image_hash_string = compute_image_hash(resized_img);
  let matching_histories =
    get_recent_image_hashes(1000, image_hash_string.clone()).unwrap_or_default();
  if let Some(existing_history) = matching_histories.first() {
    let first_item = get_first_clipboard_item();
    let mut is_favorite_item = existing_history.is_favorite.unwrap_or(false);

    if !is_favorite_item && should_auto_star_on_double_copy {
      match first_item {
        Ok(first_item) => {
          let current_time = Utc::now().timestamp_millis();
          let time_difference = current_time - first_item.updated_at;

          if first_item.history_id == existing_history.history_id
            && time_difference < 1200
            && time_difference > 200
          {
            is_favorite_item = true;
          }
        }
        Err(_) => {
          println!("Error getting first clipboard item")
        }
      }
    }

    let connection = &mut establish_pool_db_connection();
    let _ = diesel::update(clipboard_history.filter(history_id.eq(&existing_history.history_id)))
      .set((
        is_favorite.eq(is_favorite_item),
        updated_at.eq(Utc::now().timestamp_millis()),
        updated_date.eq(Utc::now().naive_utc()),
      ))
      .execute(connection);
  } else {
    let folder_path = base_dir.join("clipboard-images").join(folder_name);
    ensure_dir_exists(&folder_path);

    let image_file_name = folder_path.join(format!("{}.png", &_history_id));
    let _ = image.save(&image_file_name);

    let new_history = create_new_history(
      _history_id,
      _image_data_low_res,
      image_file_name,
      image_hash_string,
      _preview_height.try_into().unwrap(),
      _image_height.try_into().unwrap(),
      _image_width.try_into().unwrap(),
      _copied_from_app,
    );

    let _ = insert_clipboard_history(&new_history);
  }

  "ok".to_string()
}

fn resize_image_if_necessary(image: RgbaImage) -> DynamicImage {
  let (width, _height) = image.dimensions();
  if width > 400 {
    DynamicImage::ImageRgba8(image).resize(400, 400, image::imageops::FilterType::Triangle)
  } else {
    DynamicImage::ImageRgba8(image)
  }
}

fn convert_to_vec_u8(resized_img: DynamicImage) -> Vec<u8> {
  let mut buffer = Cursor::new(Vec::new());
  resized_img
    .write_to(&mut buffer, image::ImageOutputFormat::Png)
    .expect("Failed to write resized image to buffer");
  buffer.into_inner()
}

pub fn compute_image_hash(img: DynamicImage) -> String {
  let img_hash_image: img_hash::image::ImageBuffer<img_hash::image::Rgba<u8>, Vec<u8>> =
    img_hash::image::ImageBuffer::from_raw(img.width(), img.height(), img.to_bytes())
      .expect("Failed to convert to img_hash ImageBuffer");

  let hasher = HasherConfig::with_bytes_type::<ImageHashSize>().to_hasher();
  let _image_hash: ImageHash<ImageHashSize> = hasher.hash_image(&img_hash_image);
  _image_hash.to_base64()
}

fn create_new_history(
  _history_id: String,
  _image_data_low_res: Vec<u8>,
  image_file_name: PathBuf,
  image_hash_string: String,
  _image_preview_height: i32,
  _image_height: i32,
  _image_width: i32,
  _copied_from_app: Option<String>,
) -> ClipboardHistory {
  ClipboardHistory {
    history_id: _history_id,
    history_options: None,
    copied_from_app: _copied_from_app,
    title: None,
    value: None,
    value_preview: None,
    value_more_preview_lines: None,
    value_more_preview_chars: None,
    value_hash: None,
    is_text: None,
    is_code: None,
    is_link: None,
    is_video: None,
    has_emoji: None,
    has_masked_words: None,
    is_pinned: None,
    is_favorite: None,
    image_path_full_res: image_file_name.to_str().map(|s| s.to_string()),
    image_data_low_res: Some(_image_data_low_res),
    image_data_url: None,
    image_preview_height: Some(_image_preview_height),
    image_height: Some(_image_height),
    image_width: Some(_image_width),
    image_hash: Some(image_hash_string),
    is_image: Some(true),
    is_image_data: None,
    is_masked: None,
    links: None,
    detected_language: None,
    pinned_order_number: None,
    created_at: Utc::now().timestamp_millis(),
    updated_at: Utc::now().timestamp_millis(),
    created_date: Utc::now().naive_utc(),
    updated_date: Utc::now().naive_utc(),
  }
}

pub fn add_clipboard_history_from_text(
  text: String,
  detect_options: LanguageDetectOptions,
  should_auto_star_on_double_copy: bool,
  _copied_from_app: Option<String>,
) -> String {
  let mut _is_image_data = is_base64_image(&text);
  let mut _text_as_json = String::new();

  let _is_json = if !_is_image_data {
    match serde_json::from_str::<serde_json::Value>(&text) {
      Ok(val) => {
        if val.is_object() || val.is_array() {
          _text_as_json = serde_json::to_string_pretty(&val).unwrap();
          true
        } else {
          false
        }
      }
      Err(_) => false,
    }
  } else {
    false
  };

  let detected_language_str = if detect_options.should_detect_language
    && !_is_json
    && text.lines().count() >= detect_options.min_lines_required
    && !_is_image_data
    && !detect_options.enabled_languages.is_empty()
  {
    let options = lang_detect::types::Options {
      languages_to_detect: Some(detect_options.enabled_languages),
      prioritized_languages: Some(detect_options.prioritized_languages),
      ..Default::default()
    };
    match detect_language(&text, Some(options)) {
      detected if detected.language != "Unknown" => Some(detected.language),
      _ => None,
    }
  } else {
    if _is_json {
      Some("json".to_string())
    } else {
      None
    }
  };

  let mut hasher = Sha1::new();
  hasher.update(&text);
  let result = hasher.finalize();
  let _value_hash = format!("{:x}", result);

  let matching_histories = get_recent_value_hashes(10, _value_hash.clone()).unwrap_or_default();
  if let Some(existing_history) = matching_histories.first() {
    let first_item = get_first_clipboard_item();
    let mut is_favorite_item = existing_history.is_favorite.unwrap_or(false);

    if !is_favorite_item && should_auto_star_on_double_copy {
      match first_item {
        Ok(first_item) => {
          let current_time = Utc::now().timestamp_millis();
          let time_difference = current_time - first_item.updated_at;

          if first_item.history_id == existing_history.history_id
            && time_difference < 1200
            && time_difference > 200
          {
            is_favorite_item = true;
          }
        }
        Err(_) => {
          debug_output(|| {
            println!("Error getting first clipboard item");
          });
        }
      }
    }

    let connection = &mut establish_pool_db_connection();

    let _ = diesel::update(clipboard_history.filter(history_id.eq(&existing_history.history_id)))
      .set((
        is_favorite.eq(is_favorite_item),
        updated_at.eq(Utc::now().timestamp_millis()),
        updated_date.eq(Utc::now().naive_utc()),
      ))
      .execute(connection);

    "ok".to_string()
  } else {
    let mut _is_link = false;
    let mut _is_video = false;
    let mut _is_image = false;
    let mut _has_masked_words = false;

    let mut _has_emoji = false;
    let mut found_links_json = String::new();

    let _is_code = !detected_language_str.is_none();

    if !_is_code {
      let mut links_finder = LinkFinder::new();
      links_finder.url_must_have_scheme(true);

      let found_links: Vec<_> = links_finder
        .links(&text)
        .filter(|link| has_valid_tld(link.as_str()))
        .map(|link| link.as_str())
        .collect();

      found_links_json = to_string(&found_links).expect("Failed to serialize links to JSON");
      _is_link = !found_links.is_empty();
      if !_is_link {
        _has_emoji = has_emoji(&text);
      } else {
        _is_image = is_image_url(&text);
      }
      _is_video = found_links.iter().any(|link| is_youtube_url(link));
    }

    let _is_text = !_is_code && !_is_link && !_is_image && !_is_video;

    if _is_text && !detect_options.auto_mask_words_list.is_empty() {
      let mut _is_masked = false;
      let mut _value = text.clone();
      let _value_lower = _value.to_lowercase();

      for word in detect_options.auto_mask_words_list.iter() {
        if _value_lower.contains(&word.to_lowercase()) {
          _has_masked_words = true;
          break;
        }
      }
    }

    let new_history_id = nanoid!().to_string();

    let new_history = ClipboardHistory {
      history_id: new_history_id,
      history_options: None,
      copied_from_app: _copied_from_app,
      title: None,
      value: if !_text_as_json.is_empty() {
        Some(_text_as_json)
      } else {
        Some(text)
      },
      value_preview: None,
      value_more_preview_lines: None,
      value_more_preview_chars: None,
      value_hash: Some(_value_hash),
      is_text: Some(_is_text),
      is_code: Some(_is_code),
      is_link: Some(_is_link),
      is_video: Some(_is_video),
      has_emoji: Some(_has_emoji),
      has_masked_words: Some(_has_masked_words),
      is_pinned: None,
      is_favorite: None,
      is_image: Some(_is_image),
      image_data_low_res: None,
      image_path_full_res: None,
      image_data_url: None,
      image_preview_height: None,
      image_height: None,
      image_width: None,
      image_hash: None,
      is_image_data: Some(_is_image_data),
      is_masked: None,
      links: Some(found_links_json).filter(|_| _is_link),
      detected_language: detected_language_str,
      pinned_order_number: None,
      created_at: Utc::now().timestamp_millis(),
      updated_at: Utc::now().timestamp_millis(),
      created_date: Utc::now().naive_utc(),
      updated_date: Utc::now().naive_utc(),
    };

    let _ = insert_clipboard_history(&new_history);
    "ok".to_string()
  }
}

pub fn get_pinned_clipboard_histories(
  auto_mask_words_list: Vec<String>,
) -> Result<Vec<ClipboardHistoryWithMetaData>, Error> {
  let connection = &mut establish_pool_db_connection();
  let histories = clipboard_history
    .left_join(
      link_metadata_dsl.on(link_metadata::history_id.eq(clipboard_history::history_id.nullable())),
    )
    .limit(20)
    .filter(is_pinned.eq(true))
    .load::<(ClipboardHistory, Option<LinkMetadata>)>(connection)?
    .into_iter()
    .map(|(history, link_metadata)| {
      ClipboardHistoryWithMetaData::from(history, link_metadata, &auto_mask_words_list)
    })
    .collect();

  Ok(histories)
}

pub fn get_clipboard_histories(
  limit: Option<i64>,
  offset: Option<i64>,
  auto_mask_words_list: Vec<String>,
) -> Result<Vec<ClipboardHistoryWithMetaData>, Error> {
  let limit = limit.unwrap_or(100);
  let offset = offset.unwrap_or(0);

  let connection = &mut establish_pool_db_connection();

  let histories: Vec<ClipboardHistoryWithMetaData> = clipboard_history
    .left_join(
      link_metadata_dsl.on(link_metadata::history_id.eq(clipboard_history::history_id.nullable())),
    )
    .order(updated_date.desc())
    .limit(limit)
    .offset(offset)
    .load::<(ClipboardHistory, Option<LinkMetadata>)>(connection)?
    .into_iter()
    .map(|(history, link_metadata)| {
      ClipboardHistoryWithMetaData::from(history, link_metadata, &auto_mask_words_list)
    })
    .collect();

  Ok(histories)
}

pub fn get_clipboard_history_by_id(history_id_value: &String) -> Option<ClipboardHistory> {
  let connection = &mut establish_pool_db_connection();

  clipboard_history
    .find(history_id_value)
    .first::<ClipboardHistory>(connection)
    .ok()
}

pub fn delete_clipboard_history_older_than(age: Duration) -> Result<String, diesel::result::Error> {
  let connection = &mut establish_pool_db_connection();

  let now = Utc::now().timestamp_millis();
  let threshold_timestamp = now - age.num_milliseconds();

  // Handle image files
  let image_items_to_delete = clipboard_history::table
    .filter(updated_at.lt(threshold_timestamp).and(is_image.eq(true)))
    .load::<ClipboardHistory>(connection)?;

  for item in image_items_to_delete.iter() {
    if let Some(ref path) = item.image_path_full_res {
      if let Err(e) = delete_file_and_maybe_parent(&Path::new(path)) {
        eprintln!("Error deleting image file {}: {}", path, e);
      }
    }
  }

  // Handle link items
  let links_items_to_delete = clipboard_history::table
    .filter(updated_at.lt(threshold_timestamp).and(is_link.eq(true)))
    .load::<ClipboardHistory>(connection)?;

  let history_ids_to_delete: Vec<String> = links_items_to_delete
    .iter()
    .map(|item| item.history_id.clone())
    .collect();

  // Perform the main delete operation
  let deleted_count =
    diesel::delete(clipboard_history::table.filter(updated_at.lt(threshold_timestamp)))
      .execute(connection)?;

  // Delete associated link metadata
  delete_link_metadata_by_history_ids(&history_ids_to_delete);

  Ok(format!("Successfully deleted {} items", deleted_count))
}

pub fn delete_recent_clipboard_history(
  delete_duration: Duration,
) -> Result<String, diesel::result::Error> {
  let connection = &mut establish_pool_db_connection();

  let now = Utc::now().timestamp_millis();
  let delete_threshold = now - delete_duration.num_milliseconds();

  // Find records to delete (newer than delete_threshold)
  let records_to_delete = clipboard_history::table
    .filter(updated_at.gt(delete_threshold))
    .load::<ClipboardHistory>(connection)?;

  // Handle image files
  let image_items: Vec<&ClipboardHistory> = records_to_delete
    .iter()
    .filter(|item| item.is_image == Some(true))
    .collect();

  for item in image_items {
    if let Some(ref path) = item.image_path_full_res {
      if let Err(e) = delete_file_and_maybe_parent(&Path::new(path)) {
        eprintln!("Error deleting image file {}: {}", path, e);
      }
    }
  }

  println!("deleted_count: {:?}", records_to_delete);

  // Handle link items
  let link_items: Vec<&ClipboardHistory> = records_to_delete
    .iter()
    .filter(|item| item.is_link == Some(true))
    .collect();

  let history_ids_to_delete: Vec<String> = link_items
    .iter()
    .map(|item| item.history_id.clone())
    .collect();

  // Perform the main delete operation
  let deleted_count =
    diesel::delete(clipboard_history::table.filter(updated_at.gt(delete_threshold)))
      .execute(connection)?;

  // Delete associated link metadata
  delete_link_metadata_by_history_ids(&history_ids_to_delete);

  Ok(format!(
    "Successfully deleted {} recent items",
    deleted_count
  ))
}

pub fn delete_all_clipboard_histories() -> String {
  let connection = &mut establish_pool_db_connection();

  let base_dir = if cfg!(debug_assertions) {
    &APP_CONSTANTS.get().unwrap().app_dev_data_dir
  } else {
    &APP_CONSTANTS.get().unwrap().app_data_dir
  };

  let folder_path = base_dir.join("clipboard-images");

  let _ = remove_dir_if_exists(&folder_path);

  let _ = diesel::delete(clipboard_history)
    .execute(connection)
    .expect("Error deleting all clipboard histories");

  delete_all_link_metadata_with_history_ids();

  "ok".to_string()
}

pub fn delete_clipboard_history_by_ids(history_ids_value: &[String]) -> String {
  let connection = &mut establish_pool_db_connection();

  let image_items_to_delete = clipboard_history
    .filter(history_id.eq_any(history_ids_value).and(is_image.eq(true)))
    .load::<ClipboardHistory>(connection)
    .expect("Error loading clipboard history items");

  for item in image_items_to_delete.iter() {
    if let Some(ref path) = item.image_path_full_res {
      match delete_file_and_maybe_parent(&Path::new(path)) {
        Ok(_) => println!("Successfully deleted image file: {}", path),
        Err(e) => eprintln!("Error deleting image file {}: {}", path, e),
      }
    }
  }

  delete_link_metadata_by_history_ids(&history_ids_value);

  let _ = diesel::delete(clipboard_history.filter(history_id.eq_any(history_ids_value)))
    .execute(connection);

  "ok".to_string()
}

pub fn find_clipboard_histories_by_value_or_filter(
  query: &String,
  filters: &Vec<String>,
  code_filters: &Vec<String>,
  max_results: i64,
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
) -> Result<Vec<ClipboardHistoryWithMetaData>, Error> {
  let connection = &mut establish_pool_db_connection();

  let mut query_builder = clipboard_history
    .left_join(
      link_metadata_dsl.on(link_metadata::history_id.eq(clipboard_history::history_id.nullable())),
    )
    .into_boxed();

  let is_item_starred = filters.contains(&"starred".to_string());
  let is_item_pinned = filters.contains(&"pinned".to_string());

  if is_item_starred {
    query_builder = query_builder.filter(is_favorite.eq(true));
  }

  if is_item_pinned {
    query_builder = query_builder.filter(is_pinned.eq(true));
  }

  if is_item_pinned || is_item_starred {
    if filters.contains(&"text".to_string()) {
      query_builder = query_builder.filter(is_text.eq(true));
    }

    if filters.contains(&"image".to_string()) {
      query_builder = query_builder.filter(is_image.eq(true));
    }

    if filters.contains(&"link".to_string()) {
      query_builder = query_builder.filter(is_link.eq(true));
    }

    if filters.contains(&"audio".to_string()) {
      query_builder = query_builder.filter(is_link.eq(true).and(value.like("%.mp3")));
    }

    if filters.contains(&"code".to_string()) {
      query_builder = query_builder.filter(is_code.eq(true));
    }

    if filters.contains(&"video".to_string()) {
      query_builder = query_builder.filter(is_video.eq(true));
    }

    if filters.contains(&"emoji".to_string()) {
      query_builder = query_builder.filter(clipboard_history::has_emoji.eq(true));
    }

    if filters.contains(&"secret".to_string()) {
      query_builder = query_builder.filter(clipboard_history::is_masked.eq(true));
    }
  } else {
    if filters.contains(&"text".to_string()) {
      query_builder = query_builder.or_filter(is_text.eq(true));
    }

    if filters.contains(&"image".to_string()) {
      query_builder = query_builder.or_filter(is_image.eq(true));
    }

    if filters.contains(&"link".to_string()) {
      query_builder = query_builder.or_filter(is_link.eq(true));
    }

    if filters.contains(&"audio".to_string()) {
      query_builder = query_builder.filter(is_link.eq(true).and(value.like("%.mp3")));
    }

    if filters.contains(&"code".to_string()) {
      query_builder = query_builder.or_filter(is_code.eq(true));
    }

    if filters.contains(&"video".to_string()) {
      query_builder = query_builder.or_filter(is_video.eq(true));
    }

    if filters.contains(&"emoji".to_string()) {
      query_builder = query_builder.or_filter(clipboard_history::has_emoji.eq(true));
    }

    if filters.contains(&"secret".to_string()) {
      query_builder = query_builder.or_filter(clipboard_history::is_masked.eq(true));
    }
  }

  if !query.is_empty() {
    query_builder = query_builder.filter(value.like(format!("%{}%", query)));
  }

  if !code_filters.is_empty() {
    query_builder = query_builder.filter(detected_language.eq_any(code_filters));
  }

  let settings_map = app_settings.lock().unwrap();
  let mut auto_mask_words_list = Vec::new();

  if let Some(setting) = settings_map.get("isAutoMaskWordsListEnabled") {
    if let Some(value_bool) = setting.value_bool {
      if value_bool {
        auto_mask_words_list = settings_map
          .get("autoMaskWordsList")
          .and_then(|s| s.value_text.as_ref())
          .map_or(Vec::new(), |exclusion_list_text| {
            exclusion_list_text.lines().map(String::from).collect()
          });
      }
    }
  }

  let histories = query_builder
    .order(updated_date.desc())
    .limit(max_results)
    .load::<(ClipboardHistory, Option<LinkMetadata>)>(connection)?
    .into_iter()
    .map(|(history, link_metadata)| {
      ClipboardHistoryWithMetaData::from(history, link_metadata, &auto_mask_words_list)
    })
    .collect::<Vec<ClipboardHistoryWithMetaData>>();

  Ok(histories)
}

pub fn get_recent_image_hashes(limit: i64, hash: String) -> Result<Vec<ClipboardHistory>, Error> {
  let connection = &mut establish_pool_db_connection();
  clipboard_history
    .filter(image_hash.eq(hash))
    .order(updated_date.desc())
    .limit(limit)
    .load::<ClipboardHistory>(connection)
}

pub fn get_recent_value_hashes(limit: i64, hash: String) -> Result<Vec<ClipboardHistory>, Error> {
  let connection = &mut establish_pool_db_connection();
  clipboard_history
    .filter(value_hash.eq(hash))
    .order(updated_date.desc())
    .limit(limit)
    .load::<ClipboardHistory>(connection)
}

pub fn get_first_clipboard_item() -> Result<ClipboardHistory, Error> {
  let connection = &mut establish_pool_db_connection();

  clipboard_history
    .order(updated_date.desc())
    .first::<ClipboardHistory>(connection)
}

pub fn get_recent_clipboard_histories(limit: i64) -> Result<Vec<ClipboardHistory>, Error> {
  let connection = &mut establish_pool_db_connection();
  clipboard_history
    .order(updated_date.desc())
    .limit(limit)
    .load::<ClipboardHistory>(connection)
}

pub fn get_clipboard_histories_within_date_range(
  start_date: NaiveDateTime,
  end_date: NaiveDateTime,
) -> Result<Vec<ClipboardHistory>, Error> {
  let connection = &mut establish_pool_db_connection();
  clipboard_history
    .filter(created_date.between(start_date, end_date))
    .load::<ClipboardHistory>(connection)
}

pub fn count_clipboard_histories() -> Result<i64, Error> {
  let connection = &mut establish_pool_db_connection();
  clipboard_history.count().get_result::<i64>(connection)
}

pub fn insert_clipboard_history(new_clipboard_history: &ClipboardHistory) -> String {
  let connection = &mut establish_pool_db_connection();
  let _ = diesel::insert_into(clipboard_history)
    .values(new_clipboard_history)
    .execute(connection);

  "ok".to_string()
}

pub fn update_clipboard_history_by_id(
  history_id_value: &String,
  updated_data: UpdatedHistoryData,
) -> String {
  let connection = &mut establish_pool_db_connection();

  if updated_data.is_code == Some(false) {
    diesel::update(clipboard_history::table.filter(history_id.eq(history_id_value)))
      .set((
        detected_language.eq::<Option<String>>(None),
        is_code.eq::<Option<bool>>(None),
      ))
      .execute(connection)
      .expect("Error setting detected_language to NULL");

    return "ok".to_string();
  }

  let _ = diesel::update(clipboard_history::table.filter(history_id.eq(history_id_value)))
    .set(updated_data)
    .execute(connection);

  "ok".to_string()
}

pub fn update_clipboard_history_by_ids(
  history_ids_value: &[String],
  updated_data: UpdatedHistoryData,
) -> String {
  let connection = &mut establish_pool_db_connection();

  if updated_data.is_code == Some(false) {
    diesel::update(clipboard_history::table.filter(history_id.eq_any(history_ids_value)))
      .set((
        detected_language.eq::<Option<String>>(None),
        is_code.eq::<Option<bool>>(None),
      ))
      .execute(connection)
      .expect("Error setting detected_language to NULL");

    return "ok".to_string();
  }

  let _ = diesel::update(clipboard_history::table.filter(history_id.eq_any(history_ids_value)))
    .set(updated_data)
    .execute(connection);

  println!("Updated clipboard history by ids: {:?}", history_ids_value);

  "ok".to_string()
}

pub fn update_pinned_clipboard_history_by_ids(
  pinned_history_ids_value: &[String],
  pinned: bool,
) -> String {
  let connection = &mut establish_pool_db_connection();

  // Retrieve the maximum pinned_order_number if we are pinning items
  let max_pinned_order_number = if pinned {
    clipboard_history
      .select(diesel::dsl::max(pinned_order_number))
      .first::<Option<i32>>(connection)
      .expect("Error retrieving max pinned_order_number")
      .unwrap_or(0)
  } else {
    0
  };

  for (index, _history_id) in pinned_history_ids_value.iter().enumerate() {
    let new_pinned_order_number = if pinned {
      Some(max_pinned_order_number + index as i32 + 1)
    } else {
      None
    };

    // Update the pinned status and pinned_order_number
    diesel::update(clipboard_history.filter(history_id.eq(_history_id)))
      .set((
        is_pinned.eq(pinned),
        pinned_order_number.eq(new_pinned_order_number),
      ))
      .execute(connection)
      .expect("Error updating clipboard history pin status");
  }

  "ok".to_string()
}

pub fn move_pinned_item_up_down(
  history_id_value: &str,
  move_up: Option<bool>,
  move_down: Option<bool>,
) -> String {
  let connection = &mut establish_pool_db_connection();

  let target = match clipboard_history
    .filter(history_id.eq(history_id_value))
    .first::<ClipboardHistory>(connection)
  {
    Ok(target_item) => target_item,
    Err(e) => {
      debug_output(|| {
        eprintln!("Error loading target item: {}", e);
      });
      return format!("Error loading target item: {}", e);
    }
  };

  if move_up.unwrap_or(false) {
    let above_item = clipboard_history
      .filter(pinned_order_number.lt(target.pinned_order_number.unwrap_or(0)))
      .order(pinned_order_number.desc())
      .first::<ClipboardHistory>(connection);

    if let Ok(above) = above_item {
      let _ = diesel::update(clipboard_history.filter(history_id.eq(history_id_value)))
        .set(pinned_order_number.eq(above.pinned_order_number))
        .execute(connection);

      let __ = diesel::update(clipboard_history.filter(history_id.eq(above.history_id)))
        .set(pinned_order_number.eq(target.pinned_order_number))
        .execute(connection);
    }
  } else if move_down.unwrap_or(false) {
    let below_item = clipboard_history
      .filter(pinned_order_number.gt(target.pinned_order_number.unwrap_or(0)))
      .order(pinned_order_number.asc())
      .first::<ClipboardHistory>(connection);

    if let Ok(below) = below_item {
      let _ = diesel::update(clipboard_history.filter(history_id.eq(history_id_value)))
        .set(pinned_order_number.eq(below.pinned_order_number))
        .execute(connection);

      let __ = diesel::update(clipboard_history.filter(history_id.eq(below.history_id)))
        .set(pinned_order_number.eq(target.pinned_order_number))
        .execute(connection);
    }
  }

  "ok".to_string()
}

pub fn unpin_all_clipboard_history_items() -> String {
  let connection = &mut establish_pool_db_connection();

  let _ = diesel::update(clipboard_history.filter(is_pinned.eq(true)))
    .set((is_pinned.eq(false), pinned_order_number.eq(0)))
    .execute(connection);

  "ok".to_string()
}

pub fn find_clipboard_history_by_id(history_id_value: &String) -> Result<ClipboardHistory, Error> {
  let connection = &mut establish_pool_db_connection();
  clipboard_history
    .filter(history_id.eq(history_id_value))
    .first::<ClipboardHistory>(connection)
}

pub fn ensure_dir_exists(path: &PathBuf) {
  if let Err(e) = fs::create_dir_all(path) {
    eprintln!("Failed to create directory: {}", e);
  } else {
    println!("Directory created successfully {}", path.display());
  }
}

fn process_history_item(
  history_item: &mut ClipboardHistoryWithMetaData,
  auto_mask_words_list: &Vec<String>,
) {
  if history_item.is_masked == Some(true) {
    if let Some(_value) = &mut history_item.value {
      *_value = mask_value(_value);
    }
  }

  if !auto_mask_words_list.is_empty() && history_item.has_masked_words == Some(true) {
    // Precompile the regex patterns for each word in auto_mask_words_list
    let regex_patterns: Vec<Regex> = auto_mask_words_list
      .iter()
      .map(|word| Regex::new(&format!(r"(?i){}", regex::escape(word))).unwrap())
      .collect();

    let mut _is_masked = false;
    let mut _value = history_item.value.clone().unwrap_or_default();
    let _value_lower = _value.to_lowercase();

    for (word, pattern) in auto_mask_words_list.iter().zip(&regex_patterns) {
      if _value_lower.contains(&word.to_lowercase()) {
        let masked_word = mask_value(&mut word.clone());
        _value = pattern.replace_all(&_value, &masked_word).to_string();
        _is_masked = true;
      }
    }
    history_item.value = Some(_value);
    history_item.has_masked_words = Some(_is_masked);
  }

  history_item.value_more_preview_lines = history_item.value.clone().and_then(|_value| {
    if _value.chars().count() > 160 {
      let lines = _value.lines().count();
      let preview = _value.chars().take(160).collect::<String>();
      let more_line = lines - preview.lines().count();
      if more_line > 0 {
        Some(more_line as i32)
      } else {
        None
      }
    } else {
      None
    }
  });

  history_item.value_preview = history_item.value.clone().map(|_value| {
    if _value.chars().count() > 160 {
      history_item.value_more_preview_chars = {
        let preview_more_chars = _value.chars().count() - _value.chars().take(160).count();

        if preview_more_chars > 0
          && history_item.value_more_preview_lines.is_none()
          && history_item.is_image_data != Some(true)
        {
          Some(preview_more_chars as i32)
        } else {
          None
        }
      };

      _value.chars().take(160).collect()
    } else {
      _value
    }
  });

  if history_item.is_image == Some(true) {
    if let Some(_image_data_low_res) = &history_item.image_data_low_res {
      let base64_encoded: String = general_purpose::STANDARD_NO_PAD.encode(_image_data_low_res);
      history_item.image_data_low_res = None;
      history_item.image_data_url = Some(format!("data:image/png;base64,{}", base64_encoded));
    }
  }
}
