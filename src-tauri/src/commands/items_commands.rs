use std::collections::HashMap;
use std::path::Path;
use std::sync::Mutex;

use crate::menu::{self, update_system_menu};
use crate::models::models::UpdatedItemData;
use crate::models::{Item, Setting};

use crate::services::collections_service::{add_item_to_collection, add_menu_to_collection};
use crate::services::history_service;
use crate::services::items_service::{self, CreateItem};
use crate::services::utils::{
  ensure_url_prefix, is_base64_image, pretty_print_json, pretty_print_struct,
};
use base64::{engine::general_purpose, Engine as _};
use chrono::Local;
use nanoid::nanoid;
use tauri::api::dialog::blocking::FileDialogBuilder;
use url::Url;

use std::fs::File;
use std::io::Write;

#[tauri::command]
pub fn update_item_by_id(updated_item: UpdatedItemData) -> String {
  if updated_item.item_id.is_none() {
    return "Item ID is required for item update".to_string();
  }

  let _item_id_value = updated_item.item_id.clone().unwrap();

  items_service::update_item_by_id(_item_id_value, updated_item)
}

#[tauri::command]
pub fn update_items_by_ids(
  app_handle: tauri::AppHandle,
  db_items_state: tauri::State<menu::DbItems>,
  db_recent_history_items_state: tauri::State<menu::DbRecentHistoryItems>,
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
  item_ids: Vec<String>,
  updated_data: UpdatedItemData,
) -> String {
  let update_results = items_service::update_items_by_ids(&item_ids, updated_data);

  if update_results == "ok".to_string() {
    let _ = update_system_menu(
      &app_handle,
      db_items_state,
      db_recent_history_items_state,
      app_settings,
    );
  }

  update_results
}

#[tauri::command]
pub fn update_menu_item_by_id(
  app_handle: tauri::AppHandle,
  db_items_state: tauri::State<menu::DbItems>,
  db_recent_history_items_state: tauri::State<menu::DbRecentHistoryItems>,
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
  updated_item: UpdatedItemData,
) -> String {
  if updated_item.item_id.is_none() {
    return "Item ID is required for menu item update".to_string();
  }

  let _item_id_value = updated_item.item_id.clone().unwrap();

  let update_result = items_service::update_item_by_id(_item_id_value, updated_item);

  if update_result == "ok".to_string() {
    let _ = update_system_menu(
      &app_handle,
      db_items_state,
      db_recent_history_items_state,
      app_settings,
    );
  }

  update_result
}

#[tauri::command]
pub fn update_menu_items_by_ids(
  app_handle: tauri::AppHandle,
  db_items_state: tauri::State<menu::DbItems>,
  db_recent_history_items_state: tauri::State<menu::DbRecentHistoryItems>,
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
  item_ids: Vec<String>,
  updated_data: UpdatedItemData,
) -> String {
  let update_results = items_service::update_items_by_ids(&item_ids, updated_data);

  if update_results == "ok".to_string() {
    let _ = update_system_menu(
      &app_handle,
      db_items_state,
      db_recent_history_items_state,
      app_settings,
    );
  }

  update_results
}

#[tauri::command]
pub fn delete_items_by_ids(item_ids: Vec<String>, collection_id: String) -> String {
  items_service::delete_items_by_ids(&item_ids, collection_id)
}

#[tauri::command]
pub fn upload_image_file_to_item_id(
  buffer: Vec<u8>,
  file_type: String,
  item_id: String,
) -> Result<String, String> {
  items_service::upload_image_file_to_item_id(&item_id, buffer, file_type)
}

#[tauri::command]
pub fn update_item_value_by_history_id(history_id: String, item_id: String) -> String {
  let history_item = history_service::get_clipboard_history_by_id(&history_id);

  if let Some(history_item) = history_item {
    if history_item.is_image.unwrap_or(false) && history_item.image_path_full_res.is_some() {
      if let Some(history_image_path) = history_item.image_path_full_res {
        let mut image_data_url = None;

        if let Some(_image_data_low_res) = &history_item.image_data_low_res {
          let base64_encoded: String = general_purpose::STANDARD_NO_PAD.encode(_image_data_low_res);
          image_data_url = Some(format!("data:image/png;base64,{}", base64_encoded));
        }

        return match items_service::update_item_image_by_id(
          &item_id,
          image_data_url,
          history_item.image_height,
          history_item.image_width,
          history_item.image_preview_height,
          history_item.image_hash,
          &history_image_path,
        ) {
          Ok(_) => "ok".to_string(),
          Err(e) => e,
        };
      }
    }

    let updated_value = history_item.value;
    items_service::update_item_value_by_id(item_id, updated_value)
  } else {
    "History item not found".to_string()
  }
}

#[tauri::command]
pub fn add_image_to_item_id(item_id: String, image_path: String) -> Result<String, String> {
  items_service::add_image_to_item(&item_id, &image_path)
}

#[tauri::command]
pub fn delete_item_by_id(item_id: String, collection_id: String) -> String {
  items_service::delete_item_by_id(item_id, collection_id)
}

#[tauri::command]
pub fn delete_image_by_item_by_id(item_id: String) -> String {
  items_service::delete_image_by_item_by_id(item_id)
}

#[tauri::command]
pub fn delete_menu_item_by_id(
  app_handle: tauri::AppHandle,
  db_items_state: tauri::State<menu::DbItems>,
  db_recent_history_items_state: tauri::State<menu::DbRecentHistoryItems>,
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
  item_id: String,
  collection_id: String,
) -> String {
  let delete_result = items_service::delete_menu_item_by_id(item_id, collection_id);

  match delete_result {
    Ok(_) => {
      let _ = update_system_menu(
        &app_handle,
        db_items_state,
        db_recent_history_items_state,
        app_settings,
      );
      "ok".to_string()
    }
    Err(e) => format!("Error delete menu items by ids: {}", e),
  }
}

#[tauri::command]
pub fn delete_menu_items_by_ids(
  app_handle: tauri::AppHandle,
  db_items_state: tauri::State<menu::DbItems>,
  db_recent_history_items_state: tauri::State<menu::DbRecentHistoryItems>,
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
  item_ids: Vec<String>,
  collection_id: String,
) -> String {
  let delete_results = items_service::delete_menu_items_by_ids(&item_ids, collection_id);

  match delete_results {
    Ok(_) => {
      let _ = update_system_menu(
        &app_handle,
        db_items_state,
        db_recent_history_items_state,
        app_settings,
      );
      "ok".to_string()
    }
    Err(e) => format!("Error delete menu items by ids: {}", e),
  }
}

#[tauri::command]
pub fn duplicate_item(
  item_id: String,
  collection_id: String,
  tab_id: String,
  board_id: String,
) -> String {
  match items_service::get_item_by_id(item_id) {
    Ok(item) => {
      let new_item_id = nanoid!().to_string();
      let mut new_item = item;
      new_item.item_id = new_item_id;
      new_item.name = format!("Copy of {}", new_item.name);
      new_item.created_at = chrono::Utc::now().timestamp_millis();
      new_item.updated_at = chrono::Utc::now().timestamp_millis();
      new_item.created_date = chrono::Utc::now().naive_utc();
      new_item.updated_date = chrono::Utc::now().naive_utc();

      let new_item_id = items_service::create_item(&new_item);

      let _ = add_item_to_collection(
        collection_id,
        new_item_id.clone(),
        tab_id,
        Some(board_id),
        0,
      );

      new_item_id
    }
    Err(e) => format!("Item not found: {}", e),
  }
}

#[tauri::command]
pub fn duplicate_menu_item(
  app_handle: tauri::AppHandle,
  db_items_state: tauri::State<menu::DbItems>,
  db_recent_history_items_state: tauri::State<menu::DbRecentHistoryItems>,
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
  item_id: String,
  parent_id: Option<String>,
  order_number: i32,
  collection_id: String,
) -> String {
  match items_service::get_item_by_id(item_id) {
    Ok(item) => {
      let new_item_id = nanoid!().to_string();
      let mut new_item = item;
      new_item.item_id = new_item_id;
      new_item.name = format!("Copy of {}", new_item.name);
      new_item.created_at = chrono::Utc::now().timestamp_millis();
      new_item.updated_at = chrono::Utc::now().timestamp_millis();
      new_item.created_date = chrono::Utc::now().naive_utc();
      new_item.updated_date = chrono::Utc::now().naive_utc();

      let new_item_id = items_service::create_item(&new_item);

      let _ = add_menu_to_collection(collection_id, new_item_id.clone(), parent_id, order_number);

      let _ = update_system_menu(
        &app_handle,
        db_items_state,
        db_recent_history_items_state,
        app_settings,
      );

      new_item_id
    }
    Err(e) => format!("Item not found: {}", e),
  }
}

#[tauri::command]
pub fn link_clip_to_menu_item(
  item: CreateItem,
  clip_id: String,
  app_handle: tauri::AppHandle,
  db_items_state: tauri::State<menu::DbItems>,
  db_recent_history_items_state: tauri::State<menu::DbRecentHistoryItems>,
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
) -> String {
  let _ = add_menu_to_collection(
    item.collection_id,
    clip_id.clone(),
    item.parent_id,
    item.order_number,
  );

  items_service::update_item_is_menu_by_id(clip_id.clone(), true);

  let _ = update_system_menu(
    &app_handle,
    db_items_state,
    db_recent_history_items_state,
    app_settings,
  );

  clip_id
}

#[tauri::command]
pub fn create_item(item: CreateItem) -> String {
  let value = match &item.history_id {
    Some(history_id) => {
      if let Some(h_item) = history_service::get_clipboard_history_by_id(history_id) {
        let masked_value = if *(&item.is_masked) == Some(true) && h_item.value.is_some() {
          format!("[mask]{}[/mask]", h_item.value.unwrap())
        } else {
          h_item.value.unwrap_or_else(|| "".to_string())
        };

        masked_value
      } else {
        "".to_string()
      }
    }
    None => item.value.unwrap_or_else(|| "".to_string()),
  };

  let new_item_id = nanoid!().to_string();
  let mut new_item_image_path_full_res = None;
  let mut new_image_hash = None;
  let mut new_image_type = None;

  if item.is_image.unwrap_or(false) && item.image_path_full_res.is_some() {
    if let Some(history_image_path) = &item.image_path_full_res {
      new_image_hash = Some(chrono::Utc::now().timestamp_millis().to_string());
      new_image_type = Some("png".to_string());
      match items_service::save_item_image_from_history_item(&new_item_id, history_image_path) {
        Ok(path) => new_item_image_path_full_res = Some(path),
        Err(e) => println!("Error saving image: {}", e),
      };
    }
  }

  let new_item = Item {
    item_id: new_item_id,
    value: Some(value),
    name: item.name,
    description: item.description,
    detected_language: item.detected_language,
    is_deleted: false,
    is_folder: item.is_folder.unwrap_or(false),
    is_separator: item.is_separator.unwrap_or(false),
    is_menu: item.is_menu.unwrap_or(false),
    is_clip: item.is_clip.unwrap_or(false),
    is_board: item.is_board.unwrap_or(false),
    is_image: Some(item.is_image.unwrap_or(false)),
    is_link: Some(item.is_link.unwrap_or(false)),
    is_video: Some(item.is_video.unwrap_or(false)),
    is_code: Some(item.is_code.unwrap_or(false)),
    is_text: Some(item.is_text.unwrap_or(false)),
    is_form: Some(item.is_form.unwrap_or(false)),
    is_template: Some(item.is_template.unwrap_or(false)),
    is_disabled: item.is_disabled.unwrap_or(false),
    has_emoji: Some(item.has_emoji.unwrap_or(false)),
    is_file: Some(false),
    is_command: Some(false),
    is_path: Some(false),
    path_type: None,
    command_request_output: None,
    is_web_request: Some(false),
    is_web_scraping: Some(false),
    command_request_last_run_at: None,
    request_options: None,
    form_template_options: None,
    has_masked_words: Some(item.has_masked_words.unwrap_or(false)),
    image_data_url: item.image_data_url,
    image_path_full_res: new_item_image_path_full_res,
    image_height: item.image_height,
    image_width: item.image_width,
    image_preview_height: item.image_preview_height,
    image_scale: item.image_scale,
    image_type: new_image_type,
    image_hash: new_image_hash,
    links: item.links,
    is_image_data: item.is_image_data,
    is_masked: item.is_masked,
    show_description: Some(true),
    color: item.color,
    border_width: item.border_width,
    size: None,
    layout: None,
    layout_split: 1,
    layout_items_max_width: None,
    is_active: true,
    is_pinned: Some(false),
    is_favorite: Some(false),
    is_protected: Some(false),
    icon: None,
    icon_visibility: None,
    pinned_order_number: None,
    created_at: chrono::Utc::now().timestamp_millis(),
    updated_at: chrono::Utc::now().timestamp_millis(),
    created_date: chrono::Utc::now().naive_utc(),
    updated_date: chrono::Utc::now().naive_utc(),
    item_options: None,
  };

  let new_item_id = items_service::create_item(&new_item);

  if item.is_menu.unwrap_or(false) {
    let _ = add_menu_to_collection(
      item.collection_id,
      new_item_id.clone(),
      item.parent_id,
      item.order_number,
    );
  } else if item.tab_id.is_some() {
    let _ = add_item_to_collection(
      item.collection_id,
      new_item_id.clone(),
      item.tab_id.unwrap(),
      item.parent_id,
      item.order_number,
    );
  }

  new_item_id
}

#[tauri::command]
pub fn update_pinned_items_by_ids(item_ids: Vec<String>, is_pinned: bool) -> String {
  items_service::update_pinned_items_by_ids(&item_ids, is_pinned)
}

#[tauri::command]
pub fn unpin_all_items_clips() -> String {
  items_service::unpin_all_items_clips()
}

#[tauri::command]
pub fn move_pinned_clip_item_up_down(
  item_id: String,
  move_up: Option<bool>,
  move_down: Option<bool>,
) -> String {
  items_service::move_pinned_item_up_down(&item_id, move_up, move_down)
}

#[tauri::command(async)]
pub async fn save_to_file_clip_item(
  item_id: String,
  as_image: Option<bool>,
  as_mp3: Option<bool>,
) -> Result<String, String> {
  let current_datetime = Local::now().format("%Y-%m-%d-%H%M%S");

  let item = match items_service::get_item_by_id(item_id.clone()) {
    Ok(i) => i,
    Err(e) => {
      eprintln!("Failed to find item: {}", e);
      return Err("Failed to find item".to_string());
    }
  };

  if let Some(true) = as_mp3 {
    if let Some(value) = &item.value {
      let file_name: String;
      let mp3_data: Vec<u8>;

      let path = Path::new(value);
      if path.exists() {
        file_name = path
          .file_name()
          .and_then(|name| name.to_str())
          .map(String::from)
          .unwrap_or_else(|| format!("audio_{}.mp3", current_datetime));

        mp3_data = std::fs::read(path).map_err(|e| e.to_string())?;
      } else {
        let parsed_url = Url::parse(value).map_err(|e| e.to_string())?;
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

        let response = reqwest::get(value).await.map_err(|e| e.to_string())?;
        mp3_data = response.bytes().await.map_err(|e| e.to_string())?.to_vec();
      }

      let destination_path = FileDialogBuilder::new()
        .set_file_name(&file_name)
        .save_file();

      if let Some(path) = destination_path {
        // Save the MP3 file
        std::fs::write(&path, mp3_data).map_err(|e| e.to_string())?;
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

    if let Some(true) = item.is_image_data {
      if let Some(_base64_string) = &item.value {
        if is_base64_image(&_base64_string) {
          let base64_data = _base64_string.split(',').nth(1).unwrap_or(&_base64_string);
          img_data = Some(base64::decode(base64_data).map_err(|e| e.to_string())?);
        } else {
          return Err("Provided string is not a valid base64 image data".to_string());
        }
      }
    } else if let (Some(image_path), Some(true)) = (item.image_path_full_res, item.is_image) {
      // Convert relative path to absolute path
      let absolute_path = crate::db::to_absolute_image_path(&image_path);
      img_data = Some(std::fs::read(&absolute_path).map_err(|e| e.to_string())?);
    } else if let Some(true) = item.is_link {
      if let Some(image_url) = &item.value {
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
    let value = match &item.value {
      Some(val) => val,
      None => return Ok("History item value is missing".to_string()),
    };

    let file_name = format!("saved_clip_{}.txt", current_datetime);
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
