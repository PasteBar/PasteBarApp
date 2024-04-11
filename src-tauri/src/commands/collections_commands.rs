use std::collections::HashMap;
use std::sync::Mutex;

use crate::menu::{self, update_system_menu};
use crate::models::models::UpdatedCollectionData;

use crate::models::{Collection, Setting};
use crate::services::collections_service::{self, CollectionWithClips};
use crate::services::collections_service::{
  CollectionWithItems, CreateCollection, DeleteByCollectionId, SelectByCollectionId,
  UpdatedOnMoveClipData, UpdatedOnMoveMenuData,
};
use crate::services::tabs_service;
use crate::services::utils::{debug_output, pretty_print_struct};
use nanoid::nanoid;

#[tauri::command]
pub fn get_collections() -> Vec<Collection> {
  collections_service::get_collections().unwrap_or_else(|_| Vec::new())
}

#[tauri::command]
pub fn get_collection(id: String) -> Option<Collection> {
  collections_service::get_collection(&id)
}

#[tauri::command]
pub fn update_moved_menu_items_in_collection(
  app_handle: tauri::AppHandle,
  db_items_state: tauri::State<menu::DbItems>,
  db_recent_history_items_state: tauri::State<menu::DbRecentHistoryItems>,
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
  updated_move_menu_items: Vec<UpdatedOnMoveMenuData>,
) -> String {
  match collections_service::update_moved_menu_items_in_collection(updated_move_menu_items) {
    Ok(_) => {
      let _ = update_system_menu(
        &app_handle,
        db_items_state,
        db_recent_history_items_state,
        app_settings,
      );
      "ok".to_string()
    }
    Err(e) => {
      eprintln!("Failed to update moved menu items: {}", e);
      "Failed to update moved menu items".to_string()
    }
  }
}

#[tauri::command]
pub fn update_moved_clips_in_collection(updated_move_clips: Vec<UpdatedOnMoveClipData>) -> String {
  println!(
    "Processing move clips data: {}",
    pretty_print_struct(&updated_move_clips)
  );

  collections_service::update_moved_clips_in_collection(updated_move_clips)
}

#[tauri::command]
pub fn select_collection_by_id(select_collection: SelectByCollectionId) -> String {
  println!(
    "Processing select collection: {}",
    pretty_print_struct(&select_collection)
  );

  let collection_id_value = select_collection.collection_id;

  collections_service::select_collection_by_id(collection_id_value)
}

#[tauri::command]
pub fn update_collection_by_id(updated_collection: UpdatedCollectionData) -> String {
  println!(
    "Processing update collection: {}",
    pretty_print_struct(&updated_collection)
  );

  if updated_collection.collection_id.is_none() {
    return "Collection ID is required".to_string();
  }

  // Extract the collection ID and create the updated data struct
  let collection_id_value = updated_collection.collection_id.unwrap(); // unwrap is safe due to the earlier check

  let updated_data = UpdatedCollectionData {
    collection_id: None,
    title: updated_collection.title, // Use the title from the updated_collection
    description: updated_collection.description, // Use the description from the updated_collection
    is_enabled: updated_collection.is_enabled, // Use the is_enabled from the updated_collection
  };

  collections_service::update_collection_by_id(collection_id_value, updated_data)
}

#[tauri::command]
pub fn get_active_collection_with_menu_items(// app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
) -> Option<CollectionWithItems> {
  collections_service::get_active_collection_with_menu_items().ok()
}

#[tauri::command]
pub fn get_active_collection_with_clips() -> Option<CollectionWithClips> {
  collections_service::get_active_collection_with_clips().ok()
}

#[tauri::command]
pub fn delete_collection_by_id(delete_collection: DeleteByCollectionId) -> String {
  let collection_id_value = delete_collection.collection_id;

  let delete_all_items: bool = delete_collection.delete_all_items_in_collection;

  collections_service::delete_collection_by_id(&collection_id_value, delete_all_items)
}

#[tauri::command]
pub fn create_collection(
  create_collection: CreateCollection,
  add_default_menu_tab_board: bool,
) -> Result<String, String> {
  debug_output(|| {
    println!(
      "Processing create collection: {}",
      pretty_print_struct(&create_collection)
    );
  });

  let title = create_collection.title;
  let description = create_collection.description;
  let is_selected = create_collection.is_selected;

  let new_collection = Collection {
    collection_id: nanoid!().to_string(),
    title,
    description,
    is_default: false,
    is_selected,
    is_enabled: true,
    created_at: chrono::Utc::now().timestamp_millis(),
    updated_at: chrono::Utc::now().timestamp_millis(),
    created_date: chrono::Utc::now().naive_utc(),
    updated_date: chrono::Utc::now().naive_utc(),
  };

  match collections_service::create_collection(&new_collection) {
    Ok(_) => {
      if !add_default_menu_tab_board {
        let _ = collections_service::select_collection_by_id(new_collection.collection_id.clone());
        return Ok("ok".to_string());
      }
      match collections_service::create_default_menu_item(new_collection.collection_id.clone()) {
        Ok(_) => match tabs_service::create_default_tab(new_collection.collection_id.clone()) {
          Ok(default_tab_id) => {
            match collections_service::create_default_board_item(
              new_collection.collection_id.clone(),
              default_tab_id,
            ) {
              Ok(_) => {
                let _ = collections_service::select_collection_by_id(
                  new_collection.collection_id.clone(),
                );
                return Ok("ok".to_string());
              }
              Err(e) => {
                let _ =
                  collections_service::delete_collection_by_id(&new_collection.collection_id, true);
                return Err(format!(
                  "Failed to create default board item for collection: {}",
                  e
                ));
              }
            }
          }
          Err(e) => {
            let _ =
              collections_service::delete_collection_by_id(&new_collection.collection_id, true);
            return Err(format!(
              "Failed to create default tab for collection: {}",
              e
            ));
          }
        },
        Err(e) => {
          let _ = collections_service::delete_collection_by_id(&new_collection.collection_id, true);
          return Err(format!("Failed to create menu item for collection: {}", e));
        }
      }
    }
    Err(e) => Err(format!("Failed to create new collection: {}", e)),
  }
}
