use crate::models::models::UpdatedHistoryData;
use crate::models::{ClipboardHistory, Setting};
use crate::services::history_service::{self, ClipboardHistoryWithMetaData};
use crate::services::utils::{ensure_url_prefix, is_base64_image, pretty_print_struct};
use chrono::{Duration, Local};
use url::Url;

use std::collections::HashMap;
use std::fs::File;
use std::io::Write;
use std::sync::Mutex;
use tauri::api::dialog::blocking::FileDialogBuilder;

#[tauri::command]
pub fn get_clipboard_history(
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
  limit: Option<i64>,
  offset: Option<i64>,
) -> Vec<ClipboardHistoryWithMetaData> {
  let mut auto_mask_words_list = Vec::new();

  {
    let settings_map = app_settings.lock().unwrap();

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
  }

  history_service::get_clipboard_histories(limit, offset, auto_mask_words_list)
    .unwrap_or_else(|_| Vec::new())
}

#[tauri::command]
pub fn get_clipboard_history_by_id(history_id: String) -> Option<ClipboardHistory> {
  history_service::get_clipboard_history_by_id(&history_id)
}

#[tauri::command]
pub fn delete_clipboard_history_by_ids(history_ids: Vec<String>) -> String {
  history_service::delete_clipboard_history_by_ids(&history_ids)
}

#[tauri::command]
pub fn find_clipboard_histories_by_value_or_filters(
  query: String,
  filters: Vec<String>,
  code_filters: Vec<String>,
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
) -> Vec<ClipboardHistoryWithMetaData> {
  history_service::find_clipboard_histories_by_value_or_filter(
    &query,
    &filters,
    &code_filters,
    100,
    app_settings,
  )
  .unwrap_or_else(|_| Vec::new())
}

#[tauri::command]
pub fn search_clipboard_histories_by_value_or_filters(
  query: String,
  filters: Vec<String>,
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
) -> Vec<ClipboardHistoryWithMetaData> {
  let code_filters = Vec::new();

  println!(
    "search_clipboard_histories_by_value_or_filters: query: {}, filters: {:?}",
    query, filters
  );

  history_service::find_clipboard_histories_by_value_or_filter(
    &query,
    &filters,
    &code_filters,
    300,
    app_settings,
  )
  .unwrap_or_else(|_| Vec::new())
}

#[tauri::command]
pub fn get_recent_clipboard_histories(limit: i64) -> Vec<ClipboardHistory> {
  history_service::get_recent_clipboard_histories(limit).unwrap_or_else(|_| Vec::new())
}

#[tauri::command]
pub fn get_clipboard_history_pinned(
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
) -> Vec<ClipboardHistoryWithMetaData> {
  let mut auto_mask_words_list = Vec::new();

  {
    let settings_map = app_settings.lock().unwrap();

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
  }

  history_service::get_pinned_clipboard_histories(auto_mask_words_list)
    .unwrap_or_else(|_| Vec::new())
}

#[tauri::command]
pub fn get_clipboard_histories_within_date_range(
  start_date: chrono::NaiveDateTime,
  end_date: chrono::NaiveDateTime,
) -> Vec<ClipboardHistory> {
  history_service::get_clipboard_histories_within_date_range(start_date, end_date)
    .unwrap_or_else(|_| Vec::new())
}

#[tauri::command]
pub fn clear_clipboard_history_older_than(duration_type: String, older_then: String) -> String {
  // Convert older_then string to an integer.
  let duration_value: i64 = older_then.parse().unwrap_or(0);

  println!(
    "Clearing clipboard history older than {} {}",
    duration_value, duration_type
  );

  match duration_type.as_str() {
    "days" => {
      if duration_value == 0 {
        history_service::delete_all_clipboard_histories();
      } else {
        history_service::delete_clipboard_history_older_than(Duration::days(duration_value));
      }
    }
    "weeks" => {
      history_service::delete_clipboard_history_older_than(Duration::weeks(duration_value));
    }
    "months" => {
      // Roughly considering a month as 4 weeks.
      history_service::delete_clipboard_history_older_than(Duration::days(30 * duration_value));
    }
    "year" => {
      // Roughly considering a year as 52 weeks.
      history_service::delete_clipboard_history_older_than(Duration::days(356 * duration_value));
    }
    _ => {
      println!("Unsupported duration type: {}", duration_type);
      return "error".to_string();
    }
  }

  "ok".to_string()
}

#[tauri::command]
pub fn clear_recent_clipboard_history(duration_type: String, duration: String) -> String {
  let duration_value: i64 = duration.parse().unwrap_or(0);

  println!(
    "Clearing recent clipboard history for last {} {}",
    duration_value, duration_type
  );

  match duration_type.as_str() {
    "hour" => {
      history_service::delete_recent_clipboard_history(Duration::hours(duration_value));
    }
    "days" => {
      history_service::delete_recent_clipboard_history(Duration::days(duration_value));
    }
    "weeks" => {
      history_service::delete_recent_clipboard_history(Duration::weeks(duration_value));
    }
    "months" => {
      history_service::delete_recent_clipboard_history(Duration::days(30 * duration_value));
    }
    "year" => {
      history_service::delete_recent_clipboard_history(Duration::days(356 * duration_value));
    }
    _ => {
      println!("Unsupported duration type: {}", duration_type);
      return "error".to_string();
    }
  }

  "ok".to_string()
}

#[tauri::command(async)]
pub async fn save_to_file_history_item(
  history_id: String,
  as_image: Option<bool>,
  as_mp3: Option<bool>,
) -> Result<String, String> {
  let current_datetime = Local::now().format("%Y-%m-%d-%H%M%S");

  let history_item = match history_service::get_clipboard_history_by_id(&history_id) {
    Some(item) => item,
    None => return Ok("History item not found".to_string()),
  };

  if let Some(true) = as_mp3 {
    if let Some(url) = &history_item.value {
      let parsed_url = Url::parse(url).map_err(|e| e.to_string())?;

      let file_name = parsed_url
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

      let destination_path = FileDialogBuilder::new()
        .set_file_name(&file_name)
        .save_file();

      if let Some(path) = destination_path {
        let response = reqwest::get(url).await.map_err(|e| e.to_string())?;
        let bytes = response.bytes().await.map_err(|e| e.to_string())?;

        // Save the MP3 file
        std::fs::write(&path, bytes).map_err(|e| e.to_string())?;
        return Ok("saved".to_string());
      } else {
        return Ok("cancel".to_string());
      }
    } else {
      return Err("No URL found for MP3 download".to_string());
    }
  } else if let Some(true) = as_image {
    let mut img_data: Option<Vec<u8>> = None;
    let mut file_name = format!("saved_clipboard_image_{}.png", current_datetime);

    if let Some(true) = history_item.is_image_data {
      if let Some(_base64_string) = &history_item.value {
        if is_base64_image(&_base64_string) {
          let base64_data = _base64_string.split(',').nth(1).unwrap_or(&_base64_string);
          img_data = Some(base64::decode(base64_data).map_err(|e| e.to_string())?);
        } else {
          return Err("Provided string is not a valid base64 image data".to_string());
        }
      }
    } else if let (Some(image_path), Some(true)) =
      (history_item.image_path_full_res, history_item.is_image)
    {
      img_data = Some(std::fs::read(&image_path).map_err(|e| e.to_string())?);
    } else if let Some(true) = history_item.is_link {
      if let Some(image_url) = &history_item.value {
        let parsed_url = Url::parse(&ensure_url_prefix(image_url)).map_err(|e| e.to_string())?;
        file_name = parsed_url
          .path_segments()
          .and_then(|segments| segments.last())
          .unwrap_or(&file_name)
          .to_string();

        let image_response = reqwest::get(image_url).await.map_err(|e| e.to_string())?;
        let bytes = image_response.bytes().await.map_err(|e| e.to_string())?;
        img_data = Some(bytes.to_vec());
      }
    }
    if let Some(data) = img_data {
      let destination_path = FileDialogBuilder::new()
        .set_file_name(&file_name)
        .save_file();

      if let Some(path) = destination_path {
        std::fs::write(&path, data).map_err(|e| e.to_string())?;
        return Ok("saved".to_string());
      } else {
        return Ok("cancel".to_string());
      }
    } else {
      return Err("Failed to obtain image data".to_string());
    }
  } else {
    let value = match &history_item.value {
      Some(val) => val,
      None => return Ok("History item value is missing".to_string()),
    };

    let file_name = format!("saved_clipboard_{}.txt", current_datetime);
    let destination_path = FileDialogBuilder::new()
      .set_file_name(&file_name)
      .save_file();

    if let Some(path) = destination_path {
      let mut file = File::create(&path).map_err(|e| e.to_string())?;
      file
        .write_all(value.as_bytes())
        .map_err(|e| e.to_string())?;
      return Ok("saved".to_string());
    } else {
      return Ok("cancel".to_string());
    }
  }
}

#[tauri::command]
pub fn count_clipboard_histories() -> i64 {
  history_service::count_clipboard_histories().unwrap_or(0)
}

#[tauri::command]
pub fn insert_clipboard_history(new_history: ClipboardHistory) -> String {
  history_service::insert_clipboard_history(&new_history)
}

#[tauri::command]
pub fn update_clipboard_history_by_id(
  history_id: String,
  updated_data: UpdatedHistoryData,
) -> String {
  history_service::update_clipboard_history_by_id(&history_id, updated_data)
}

#[tauri::command]
pub fn update_clipboard_history_by_ids(
  history_ids: Vec<String>,
  updated_data: UpdatedHistoryData,
) -> String {
  history_service::update_clipboard_history_by_ids(&history_ids, updated_data)
}

#[tauri::command]
pub fn update_pinned_clipboard_history_by_ids(history_ids: Vec<String>, is_pinned: bool) -> String {
  history_service::update_pinned_clipboard_history_by_ids(&history_ids, is_pinned)
}

#[tauri::command]
pub fn unpin_all_clipboard_history_items() -> String {
  history_service::unpin_all_clipboard_history_items()
}

#[tauri::command]
pub fn move_pinned_item_up_down(
  history_id: String,
  move_up: Option<bool>,
  move_down: Option<bool>,
) -> String {
  history_service::move_pinned_item_up_down(&history_id, move_up, move_down)
}

#[tauri::command]
pub fn find_clipboard_history_by_id(history_id: String) -> Option<ClipboardHistory> {
  history_service::find_clipboard_history_by_id(&history_id).ok()
}
