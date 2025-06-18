use std::fs;
use std::path::Path;

use crate::db::{self};
use crate::models::models::{CollectionMenu, UpdatedItemData};
use crate::models::Item;
use crate::services::utils::debug_output;
use image::ImageFormat;

use crate::schema::collection_clips::dsl::collection_clips;
use crate::schema::collection_clips::dsl::{self as collection_clips_dsl};
use crate::schema::items::dsl::items;
use crate::schema::items::{
  all_columns, command_request_last_run_at, command_request_output, image_data_url, image_hash,
  image_height, image_path_full_res, image_preview_height, image_scale, image_type, image_width,
  is_clip, is_image, is_menu, is_pinned, item_id as item_id_field, pinned_order_number, updated_at,
  updated_date, value,
};
use std::io::Cursor;

use crate::schema::collection_menu::dsl::{self as collection_menu_dsl, collection_menu};
use crate::services::history_service::ensure_dir_exists;
use base64::engine::general_purpose::STANDARD_NO_PAD;
use base64::Engine as _;
use image::{self, imageops::FilterType, DynamicImage, GenericImageView, ImageOutputFormat};

use serde::{Deserialize, Serialize};

use crate::db::establish_pool_db_connection;
use diesel::prelude::*;
use diesel::result::Error;

use super::utils::delete_file_and_maybe_parent;

#[derive(Queryable, Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CreateItem {
  pub history_id: Option<String>,
  pub history_options: Option<String>,
  pub item_options: Option<String>,
  pub name: String,
  pub description: Option<String>,
  pub detected_language: Option<String>,
  pub value: Option<String>,
  pub is_folder: Option<bool>,
  pub is_separator: Option<bool>,
  pub is_board: Option<bool>,
  pub is_clip: Option<bool>,
  pub is_menu: Option<bool>,
  pub is_image: Option<bool>,
  pub is_link: Option<bool>,
  pub is_video: Option<bool>,
  pub is_code: Option<bool>,
  pub is_text: Option<bool>,
  pub is_form: Option<bool>,
  pub is_template: Option<bool>,
  pub is_protected: Option<bool>,
  pub is_disabled: Option<bool>,
  pub has_emoji: Option<bool>,
  pub has_masked_words: Option<bool>,
  pub image_data_url: Option<String>,
  pub image_path_full_res: Option<String>,
  pub image_height: Option<i32>,
  pub image_width: Option<i32>,
  pub image_preview_height: Option<i32>,
  pub image_hash: Option<String>,
  pub image_type: Option<String>,
  pub image_scale: Option<i32>,
  pub links: Option<String>,
  pub is_image_data: Option<bool>,
  pub is_masked: Option<bool>,
  pub color: Option<String>,
  pub border_width: Option<i32>,
  pub value_type_id: Option<String>,
  pub order_number: i32,
  pub parent_id: Option<String>,
  pub tab_id: Option<String>,
  pub collection_id: String,
}

#[derive(Queryable, Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PinnedItem {
  pub item_id: String,
  pub is_pinned: Option<bool>,
  pub pinned_order_number: Option<i32>,
}

#[derive(Queryable, Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ItemWithImage {
  pub is_image: Option<bool>,
  pub image_path_full_res: Option<String>,
}

pub fn get_item_by_id(item_id: String) -> Result<Item, String> {
  let connection = &mut establish_pool_db_connection();

  let found_item = items
    .find(&item_id)
    .select(all_columns)
    .first::<Item>(connection);

  match found_item {
    Ok(mut item) => {
      // Transform image path for frontend consumption
      item.transform_image_path_for_frontend();
      Ok(item)
    }
    Err(e) => Err(format!("Item not found: {}", e)),
  }
}

pub fn update_item_is_menu_by_id(item_id: String, is_menu_value: bool) -> String {
  let connection = &mut establish_pool_db_connection();

  let _ = diesel::update(items.find(item_id))
    .set(is_menu.eq(is_menu_value))
    .execute(connection);

  "ok".to_string()
}

pub fn update_item_by_id(item_id: String, updated_data: UpdatedItemData) -> String {
  let connection = &mut establish_pool_db_connection();

  let should_update_timestamps = updated_data.name.is_some()
    || updated_data.value.is_some()
    || updated_data.description.is_some()
    || updated_data.is_code.is_some()
    || updated_data.detected_language.is_some()
    || updated_data.is_text.is_some()
    || updated_data.is_image.is_some();

  if updated_data.is_command.is_some()
    || updated_data.is_web_scraping.is_some()
    || updated_data.is_web_request.is_some()
  {
    let _ = diesel::update(items.find(item_id))
      .set((
        updated_data,
        command_request_output.eq::<Option<String>>(None),
        command_request_last_run_at.eq::<Option<i64>>(None),
      ))
      .execute(connection);
  } else if updated_data.command_request_output.is_some() {
    let _ = diesel::update(items.find(item_id))
      .set((
        updated_data,
        command_request_last_run_at.eq(chrono::Utc::now().timestamp_millis()),
      ))
      .execute(connection);
  } else if should_update_timestamps {
    let _ = diesel::update(items.find(item_id))
      .set((
        updated_data,
        updated_at.eq(chrono::Utc::now().timestamp_millis()),
        updated_date.eq(chrono::Utc::now().naive_utc()),
      ))
      .execute(connection);
  } else {
    // debug_output(|| {
    // println!("Updated_data: {:?}", updated_data);
    // });

    let _ = diesel::update(items.find(item_id))
      .set(updated_data)
      .execute(connection);
  }

  "ok".to_string()
}

pub fn update_item_value_by_id(item_id: String, value_text: Option<String>) -> String {
  let connection = &mut establish_pool_db_connection();
  let _ = diesel::update(items.find(item_id))
    .set((
      value.eq(value_text),
      updated_at.eq(chrono::Utc::now().timestamp_millis()),
      updated_date.eq(chrono::Utc::now().naive_utc()),
    ))
    .execute(connection);

  "ok".to_string()
}

pub fn update_item_image_by_id(
  item_id: &str,
  history_item_image_data_url: Option<String>,
  history_item_image_height: Option<i32>,
  history_item_image_width: Option<i32>,
  history_item_image_preview_height: Option<i32>,
  history_item_image_hash: Option<String>,
  image_path: &str,
) -> Result<String, String> {
  match save_item_image_from_history_item(item_id, image_path) {
    Ok(clip_image_file_name) => {
      let connection = &mut establish_pool_db_connection();

      let _ = diesel::update(items.find(item_id))
        .set((
          image_path_full_res.eq(clip_image_file_name),
          image_data_url.eq(history_item_image_data_url),
          image_height.eq(history_item_image_height),
          image_width.eq(history_item_image_width),
          image_preview_height.eq(history_item_image_preview_height),
          image_hash.eq(history_item_image_hash),
          image_type.eq("png"),
          updated_at.eq(chrono::Utc::now().timestamp_millis()),
          updated_date.eq(chrono::Utc::now().naive_utc()),
        ))
        .execute(connection);

      Ok("ok".to_string())
    }
    Err(e) => Err(format!("Error updating image: {}", e)),
  }
}

pub fn update_items_by_ids(item_ids: &[String], updated_data: UpdatedItemData) -> String {
  let connection = &mut establish_pool_db_connection();
  let _ = diesel::update(items.filter(item_id_field.eq_any(item_ids)))
    .set((
      updated_data,
      updated_at.eq(chrono::Utc::now().timestamp_millis()),
      updated_date.eq(chrono::Utc::now().naive_utc()),
    ))
    .execute(connection);

  "ok".to_string()
}

pub fn delete_image_by_item_by_id(item_id: String) -> String {
  let connection = &mut establish_pool_db_connection();

  let item_with_images_to_delete = match items
    .find(&item_id)
    .select((is_image, image_path_full_res))
    .first::<ItemWithImage>(connection)
  {
    Ok(item) => item,
    Err(e) => {
      debug_output(|| {
        eprintln!("Error loading item: {}", e);
      });
      return format!("Error loading item: {}", e);
    }
  };

  if let Some(ref path) = item_with_images_to_delete.image_path_full_res {
    match delete_file_and_maybe_parent(&Path::new(path)) {
      Ok(_) => {
        debug_output(|| {
          println!("Successfully deleted image file: {}", path);
        });
      }
      Err(e) => {
        debug_output(|| {
          eprintln!("Error deleting image file {}: {}", path, e);
        });
      }
    }
  }

  // Update the item record in the database.
  let _ = diesel::update(items.find(&item_id))
    .set((
      image_path_full_res.eq::<Option<String>>(None),
      image_data_url.eq::<Option<String>>(None),
      image_height.eq::<Option<i32>>(None),
      image_width.eq::<Option<i32>>(None),
      image_hash.eq::<Option<String>>(None),
      image_type.eq::<Option<String>>(None),
      image_scale.eq::<Option<i32>>(Some(1)),
      image_preview_height.eq::<Option<i32>>(None),
    ))
    .execute(connection);

  "ok".to_string()
}

pub fn delete_item_by_id(item_id: String, collection_id: String) -> String {
  let connection = &mut establish_pool_db_connection();

  let item_with_images_to_delete = match items
    .find(&item_id)
    .select((is_image, image_path_full_res))
    .first::<ItemWithImage>(connection)
  {
    Ok(item) => item,
    Err(e) => {
      debug_output(|| {
        eprintln!("Error loading item: {}", e);
      });
      return format!("Error loading item: {}", e);
    }
  };

  if let Some(ref path) = item_with_images_to_delete.image_path_full_res {
    match delete_file_and_maybe_parent(&Path::new(path)) {
      Ok(_) => {
        debug_output(|| {
          println!("Successfully deleted image file: {}", path);
        });
      }
      Err(e) => {
        debug_output(|| {
          eprintln!("Error deleting image file {}: {}", path, e);
        });
      }
    }
  }

  let _ = diesel::delete(items.find(&item_id)).execute(connection);

  let _ = diesel::delete(
    collection_clips
      .filter(collection_clips_dsl::collection_id.eq(&collection_id))
      .filter(collection_clips_dsl::item_id.eq(&item_id)),
  )
  .execute(connection);

  let _ = diesel::delete(
    collection_menu
      .filter(collection_menu_dsl::collection_id.eq(&collection_id))
      .filter(collection_menu_dsl::item_id.eq(&item_id)),
  )
  .execute(connection);

  "ok".to_string()
}

pub fn delete_items_by_ids(item_ids: &[String], collection_id: String) -> String {
  let connection = &mut establish_pool_db_connection();

  let items_with_images: Vec<ItemWithImage> = match items
    .filter(item_id_field.eq_any(item_ids))
    .select((is_image, image_path_full_res))
    .load::<ItemWithImage>(connection)
  {
    Ok(result_items) => result_items,
    Err(e) => {
      debug_output(|| {
        eprintln!("Error loading items: {}", e);
      });
      return format!("Error loading items: {}", e);
    }
  };

  for item in items_with_images.iter() {
    if let Some(ref path) = item.image_path_full_res {
      if let Err(e) = delete_file_and_maybe_parent(Path::new(path)) {
        eprintln!("Error deleting image file {}: {}", path, e);
      }
    }
  }

  let _ = diesel::delete(items.filter(item_id_field.eq_any(item_ids)))
    .execute(connection)
    .map_err(|e| {
      debug_output(|| {
        eprintln!("Error deleting items: {}", e);
      });
      e.to_string()
    });

  let _ = diesel::delete(
    collection_clips
      .filter(collection_clips_dsl::collection_id.eq(&collection_id))
      .filter(collection_clips_dsl::item_id.eq_any(item_ids)),
  )
  .execute(connection);

  let _ = diesel::delete(
    collection_menu
      .filter(collection_menu_dsl::collection_id.eq(&collection_id))
      .filter(collection_menu_dsl::item_id.eq_any(item_ids)),
  )
  .execute(connection);

  "ok".to_string()
}

pub fn delete_menu_item_by_id(item_id: String, collection_id: String) -> Result<String, Error> {
  let connection = &mut establish_pool_db_connection();

  // First, get the parent_id and order_number of the item being deleted
  let menu_item_info: Option<(Option<String>, i32)> = collection_menu
    .filter(collection_menu_dsl::collection_id.eq(&collection_id))
    .filter(collection_menu_dsl::item_id.eq(&item_id))
    .select((
      collection_menu_dsl::parent_id,
      collection_menu_dsl::order_number,
    ))
    .first(connection)
    .optional()?;

  if let Some((parent_id, parent_order)) = menu_item_info {
    // Find all children of the item being deleted
    let children: Vec<CollectionMenu> = collection_menu
      .filter(collection_menu_dsl::collection_id.eq(&collection_id))
      .filter(collection_menu_dsl::parent_id.eq(&item_id))
      .order(collection_menu_dsl::order_number.asc())
      .load::<CollectionMenu>(connection)?;

    // Update children to point to their grandparent and adjust order numbers
    for (index, child) in children.iter().enumerate() {
      diesel::update(
        collection_menu
          .filter(collection_menu_dsl::collection_id.eq(&collection_id))
          .filter(collection_menu_dsl::item_id.eq(&child.item_id)),
      )
      .set((
        collection_menu_dsl::parent_id.eq(&parent_id),
        collection_menu_dsl::order_number.eq(parent_order + (index as i32) + 1),
      ))
      .execute(connection)?;
    }

    // Adjust order numbers of siblings that come after the deleted item and its children
    let shift_amount = children.len() as i32;

    // Handle both cases: when parent_id is NULL and when it has a value
    match &parent_id {
      Some(pid) => {
        diesel::update(
          collection_menu
            .filter(collection_menu_dsl::collection_id.eq(&collection_id))
            .filter(collection_menu_dsl::parent_id.eq(pid))
            .filter(collection_menu_dsl::order_number.gt(parent_order)),
        )
        .set(collection_menu_dsl::order_number.eq(collection_menu_dsl::order_number + shift_amount))
        .execute(connection)?;
      }
      None => {
        diesel::update(
          collection_menu
            .filter(collection_menu_dsl::collection_id.eq(&collection_id))
            .filter(collection_menu_dsl::parent_id.is_null())
            .filter(collection_menu_dsl::order_number.gt(parent_order)),
        )
        .set(collection_menu_dsl::order_number.eq(collection_menu_dsl::order_number + shift_amount))
        .execute(connection)?;
      }
    }
  }

  // Check if the item is a clip before attempting to delete it from the items table
  let item_clip_status = items
    .find(&item_id)
    .select(is_clip)
    .first::<bool>(connection);

  match item_clip_status {
    Ok(true) => {
      diesel::update(items.find(&item_id))
        .set(is_menu.eq(false))
        .execute(connection)?;
    }
    Ok(false) => {
      diesel::delete(items.find(&item_id)).execute(connection)?;
    }
    Err(e) => {
      eprintln!("Failed to query item clip status: {}", e);
      return Err(e);
    }
  }

  let _ = diesel::delete(
    collection_menu
      .filter(collection_menu_dsl::collection_id.eq(&collection_id))
      .filter(collection_menu_dsl::item_id.eq(&item_id)),
  )
  .execute(connection);

  Ok("ok".to_string())
}

pub fn delete_menu_items_by_ids(
  item_ids: &[String],
  collection_id: String,
) -> Result<String, Error> {
  let connection = &mut establish_pool_db_connection();

  // Process each item to handle child repositioning
  for item_id in item_ids {
    // Get the parent_id and order_number of the item being deleted
    let menu_item_info: Option<(Option<String>, i32)> = collection_menu
      .filter(collection_menu_dsl::collection_id.eq(&collection_id))
      .filter(collection_menu_dsl::item_id.eq(item_id))
      .select((
        collection_menu_dsl::parent_id,
        collection_menu_dsl::order_number,
      ))
      .first(connection)
      .optional()?;

    if let Some((parent_id, parent_order)) = menu_item_info {
      // Find all children of the item being deleted
      let children: Vec<CollectionMenu> = collection_menu
        .filter(collection_menu_dsl::collection_id.eq(&collection_id))
        .filter(collection_menu_dsl::parent_id.eq(item_id))
        .order(collection_menu_dsl::order_number.asc())
        .load::<CollectionMenu>(connection)?;

      // Update children to point to their grandparent and adjust order numbers
      for (index, child) in children.iter().enumerate() {
        // Only update if the child is not also being deleted
        if !item_ids.contains(&child.item_id) {
          diesel::update(
            collection_menu
              .filter(collection_menu_dsl::collection_id.eq(&collection_id))
              .filter(collection_menu_dsl::item_id.eq(&child.item_id)),
          )
          .set((
            collection_menu_dsl::parent_id.eq(&parent_id),
            collection_menu_dsl::order_number.eq(parent_order + (index as i32) + 1),
          ))
          .execute(connection)?;
        }
      }

      // Count children that will be repositioned (not deleted)
      let repositioned_children_count = children
        .iter()
        .filter(|child| !item_ids.contains(&child.item_id))
        .count() as i32;

      // Adjust order numbers of siblings that come after the deleted item and its repositioned children
      if repositioned_children_count > 0 {
        match &parent_id {
          Some(pid) => {
            diesel::update(
              collection_menu
                .filter(collection_menu_dsl::collection_id.eq(&collection_id))
                .filter(collection_menu_dsl::parent_id.eq(pid))
                .filter(collection_menu_dsl::order_number.gt(parent_order))
                .filter(collection_menu_dsl::item_id.ne_all(item_ids)),
            )
            .set(
              collection_menu_dsl::order_number
                .eq(collection_menu_dsl::order_number + repositioned_children_count),
            )
            .execute(connection)?;
          }
          None => {
            diesel::update(
              collection_menu
                .filter(collection_menu_dsl::collection_id.eq(&collection_id))
                .filter(collection_menu_dsl::parent_id.is_null())
                .filter(collection_menu_dsl::order_number.gt(parent_order))
                .filter(collection_menu_dsl::item_id.ne_all(item_ids)),
            )
            .set(
              collection_menu_dsl::order_number
                .eq(collection_menu_dsl::order_number + repositioned_children_count),
            )
            .execute(connection)?;
          }
        }
      }
    }
  }

  let clips: Vec<String> = items
    .select(item_id_field)
    .filter(item_id_field.eq_any(item_ids))
    .filter(is_clip.eq(true))
    .load::<String>(connection)?;

  if !clips.is_empty() {
    diesel::update(items.filter(item_id_field.eq_any(&clips)))
      .set(is_menu.eq(false))
      .execute(connection)?;
  }

  let non_clip_item_ids: Vec<&String> = item_ids.iter().filter(|id| !clips.contains(id)).collect();

  if !non_clip_item_ids.is_empty() {
    diesel::delete(items.filter(item_id_field.eq_any(&non_clip_item_ids))).execute(connection)?;
  }

  let _ = diesel::delete(
    collection_menu
      .filter(collection_menu_dsl::collection_id.eq(&collection_id))
      .filter(collection_menu_dsl::item_id.eq_any(item_ids)),
  )
  .execute(connection);

  Ok("ok".to_string())
}

pub fn create_item(new_item: &Item) -> String {
  let connection = &mut establish_pool_db_connection();

  let _ = diesel::insert_into(items)
    .values(new_item)
    .execute(connection);

  new_item.item_id.clone()
}

pub fn update_pinned_items_by_ids(item_ids: &[String], pinned: bool) -> String {
  let connection = &mut establish_pool_db_connection();

  let max_pinned_order_number = if pinned {
    match items
      .select(diesel::dsl::max(pinned_order_number))
      .first::<Option<i32>>(connection)
    {
      Ok(Some(max_num)) => max_num,
      Ok(None) => 0,
      Err(e) => {
        debug_output(|| {
          eprintln!("Error retrieving max pinned_order_number: {}", e);
        });
        0
      }
    }
  } else {
    0
  };

  for (index, _item_id) in item_ids.iter().enumerate() {
    let new_pinned_order_number = if pinned {
      Some(max_pinned_order_number + index as i32 + 1)
    } else {
      None
    };

    let _ = diesel::update(items.filter(item_id_field.eq(_item_id)))
      .set((
        is_pinned.eq(pinned),
        pinned_order_number.eq(new_pinned_order_number),
      ))
      .execute(connection);
  }

  "ok".to_string()
}

pub fn add_image_to_item(item_id: &str, image_full_path: &str) -> Result<String, String> {
  let image_path = Path::new(image_full_path);

  if !image_path.exists() {
    return Err("Image file does not exist".to_string());
  }

  let extension = image_path
    .extension()
    .and_then(|ext| ext.to_str())
    .ok_or("Failed to read image extension")?
    .to_lowercase();

  let is_svg = extension == "svg";

  let folder_path = db::get_clip_images_dir().join(&item_id[..3]);
  ensure_dir_exists(&folder_path);
  let new_image_path = folder_path.join(format!("{}.{}", item_id, extension));

  fs::copy(image_path, &new_image_path).map_err(|_| "Failed to copy image")?;

  let (_image_data_url, _image_width, _image_height) = if is_svg {
    let svg_data = std::fs::read(&new_image_path).map_err(|e| e.to_string())?;
    let base64_encoded = STANDARD_NO_PAD.encode(&svg_data);
    let _image_data_url = format!("data:image/svg+xml;base64,{}", base64_encoded);

    (Some(_image_data_url), None, None)
  } else {
    let img = image::open(&new_image_path).map_err(|_| "Failed to open image")?;
    let (width, height) = img.dimensions();

    let resized_img = resize_image_if_necessary(img);
    let _image_data_low_res = convert_to_vec_u8(resized_img);

    let base64_encoded = STANDARD_NO_PAD.encode(&_image_data_low_res);
    let data_url = format!("data:image/{};base64,{}", extension, base64_encoded);

    (Some(data_url), Some(width as i32), Some(height as i32))
  };

  let _image_hash_string = chrono::Utc::now().timestamp_millis().to_string();

  let connection = &mut establish_pool_db_connection();

  // Convert absolute path to relative path before storing
  let relative_image_path = new_image_path
    .to_str()
    .map(|path| db::to_relative_image_path(path));

  diesel::update(items.find(item_id))
    .set((
      image_path_full_res.eq(relative_image_path),
      is_image.eq(true),
      image_height.eq(_image_height),
      image_width.eq(_image_width),
      image_data_url.eq(_image_data_url),
      image_hash.eq(_image_hash_string),
      image_type.eq(&extension),
      updated_at.eq(chrono::Utc::now().timestamp_millis()),
      updated_date.eq(chrono::Utc::now().naive_utc()),
    ))
    .execute(connection)
    .map_err(|_| "Failed to update item in database")?;

  Ok("ok".to_string())
}

pub fn move_pinned_item_up_down(
  item_id_value: &str,
  move_up: Option<bool>,
  move_down: Option<bool>,
) -> String {
  let connection = &mut establish_pool_db_connection();

  let target = match items
    .filter(item_id_field.eq(item_id_value))
    .select((item_id_field, is_pinned, pinned_order_number))
    .first::<PinnedItem>(connection)
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
    let above_item = items
      .filter(pinned_order_number.lt(target.pinned_order_number.unwrap_or(0)))
      .select((item_id_field, is_pinned, pinned_order_number))
      .order(pinned_order_number.desc())
      .first::<PinnedItem>(connection);

    if let Ok(above) = above_item {
      let _ = diesel::update(items.filter(item_id_field.eq(item_id_value)))
        .set(pinned_order_number.eq(above.pinned_order_number))
        .execute(connection);

      let __ = diesel::update(items.filter(item_id_field.eq(above.item_id)))
        .set(pinned_order_number.eq(target.pinned_order_number))
        .execute(connection);
    }
  } else if move_down.unwrap_or(false) {
    let below_item = items
      .filter(pinned_order_number.gt(target.pinned_order_number.unwrap_or(0)))
      .select((item_id_field, is_pinned, pinned_order_number))
      .order(pinned_order_number.asc())
      .first::<PinnedItem>(connection);

    if let Ok(below) = below_item {
      let _ = diesel::update(items.filter(item_id_field.eq(item_id_value)))
        .set(pinned_order_number.eq(below.pinned_order_number))
        .execute(connection);

      let __ = diesel::update(items.filter(item_id_field.eq(below.item_id)))
        .set(pinned_order_number.eq(target.pinned_order_number))
        .execute(connection);
    }
  }

  "ok".to_string()
}

pub fn unpin_all_items_clips() -> String {
  let connection = &mut establish_pool_db_connection();

  let _ = diesel::update(items.filter(is_pinned.eq(true)))
    .set((is_pinned.eq(false), pinned_order_number.eq(0)))
    .execute(connection);

  "ok".to_string()
}

pub fn save_item_image_from_history_item(
  item_id: &str,
  history_image_path: &str,
) -> Result<String, String> {
  let folder_name = &item_id[..3];

  let folder_path = db::get_clip_images_dir().join(folder_name);
  ensure_dir_exists(&folder_path);

  let clip_image_file_name = folder_path.join(format!("{}.png", &item_id));

  let image_data = fs::read(history_image_path).map_err(|e| {
    debug_output(|| {
      println!("Error reading image file: {}", e);
    });
    e.to_string()
  })?;

  fs::write(&clip_image_file_name, &image_data).map_err(|e| {
    debug_output(|| {
      println!(
        "Error saving image in save_item_image_from_history_item: {}",
        e
      );
    });
    e.to_string()
  })?;

  // Return relative path instead of absolute path
  let relative_path = clip_image_file_name
    .to_str()
    .map(|path| db::to_relative_image_path(path))
    .unwrap_or_default();
  Ok(relative_path)
}

pub fn upload_image_file_to_item_id(
  item_id: &str,
  buffer: Vec<u8>,
  file_type: String,
) -> Result<String, String> {
  let (format, extension, is_svg) = match file_type.as_str() {
    "image/jpeg" => (Some(ImageFormat::Jpeg), "jpeg", false),
    "image/jpg" => (Some(ImageFormat::Jpeg), "jpg", false),
    "image/png" => (Some(ImageFormat::Png), "png", false),
    "image/gif" => (Some(ImageFormat::Gif), "gif", false),
    "image/webp" => (Some(ImageFormat::WebP), "webp", false),
    "image/svg+xml" => (None, "svg", true),
    _ => return Err("Unsupported file type".to_string()),
  };

  let file_name = format!("{}.{}", item_id, extension);

  let folder_path = db::get_clip_images_dir().join(&item_id[..3]);
  ensure_dir_exists(&folder_path);
  let image_path = folder_path.join(&file_name);

  std::fs::write(&image_path, &buffer).map_err(|e| format!("Failed to save image file: {}", e))?;

  let (_image_data_url, _image_width, _image_height) = if is_svg {
    let base64_encoded = STANDARD_NO_PAD.encode(&buffer);
    let _image_data_url = format!("data:{};base64,{}", file_type, base64_encoded);

    (Some(_image_data_url), None, None)
  } else {
    let img = image::load_from_memory_with_format(&buffer, format.unwrap())
      .map_err(|e| format!("Failed to load image: {}", e))?;

    let (_image_width, _image_height) = img.dimensions();
    let resized_img = resize_image_if_necessary(img);
    let _image_data_low_res = convert_to_vec_u8(resized_img);

    let base64_encoded = STANDARD_NO_PAD.encode(&_image_data_low_res);
    let _image_data_url = format!("data:{};base64,{}", file_type, base64_encoded);
    let _image_hash_string = chrono::Utc::now().timestamp_millis().to_string();

    (
      Some(_image_data_url),
      Some(_image_width as i32),
      Some(_image_height as i32),
    )
  };

  let _image_hash_string = chrono::Utc::now().timestamp_millis().to_string();
  let connection = &mut establish_pool_db_connection();

  // Convert absolute path to relative path before storing
  let relative_image_path = image_path
    .to_str()
    .map(|path| db::to_relative_image_path(path));

  let _ = diesel::update(items.find(item_id))
    .set((
      image_path_full_res.eq(relative_image_path),
      image_data_url.eq(_image_data_url),
      image_height.eq(_image_height),
      image_width.eq(_image_width),
      image_hash.eq(_image_hash_string),
      image_type.eq(extension),
      image_scale.eq(1),
      is_image.eq(true),
      updated_at.eq(chrono::Utc::now().timestamp_millis()),
      updated_date.eq(chrono::Utc::now().naive_utc()),
    ))
    .execute(connection)
    .map_err(|_| "Failed to update item in database")?;

  Ok("ok".to_string())
}

fn resize_image_if_necessary(image: DynamicImage) -> DynamicImage {
  let (width, _) = image.dimensions();
  if width > 400 {
    image.resize(400, 400, FilterType::Triangle)
  } else {
    image
  }
}

fn convert_to_vec_u8(image: DynamicImage) -> Vec<u8> {
  let mut buffer = Cursor::new(Vec::new());

  image.write_to(&mut buffer, ImageOutputFormat::Png).unwrap();
  buffer.into_inner()
}
