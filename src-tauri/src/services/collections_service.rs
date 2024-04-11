use crate::models::models::CollectionClips;
use crate::models::models::Tabs;
use crate::models::Item;
use crate::schema::collection_clips::dsl::{self as collection_clips_dsl};
use crate::schema::collection_menu::dsl::{self as collection_menu_dsl, collection_menu};
use crate::schema::collections::dsl::{self as collections_dsl, collections};
use crate::schema::items::dsl::{self as items_dsl, items};

use crate::schema::tabs::dsl::{self as tab_dsl, tabs};
use chrono::NaiveDateTime;
use diesel::result::Error;

use diesel::sql_types::Text;
use serde::{Deserialize, Serialize};

use crate::{
  db::establish_pool_db_connection, models::models::UpdatedCollectionData, models::Collection,
  models::CollectionMenu,
};
use diesel::associations::HasTable;
use diesel::prelude::*;

use super::items_service;
use super::items_service::CreateItem;

#[derive(Queryable, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateCollection {
  pub title: String,
  pub is_selected: bool,
  pub description: Option<String>,
}

#[derive(Queryable, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeleteByCollectionId {
  pub delete_all_items_in_collection: bool,
  pub collection_id: String,
}

#[derive(Queryable, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SelectByCollectionId {
  pub collection_id: String,
}

#[derive(Queryable, Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AssociatedClips {
  pub item_id: String,
  pub name: String,
  pub description: Option<String>,
  pub value: Option<String>,
  pub is_active: bool,
  pub is_deleted: bool,
  pub is_folder: bool,
  pub is_separator: bool,
  pub is_image: Option<bool>,
  pub is_text: Option<bool>,
  pub is_form: Option<bool>,
  pub is_template: Option<bool>,
  pub is_link: Option<bool>,
  pub is_video: Option<bool>,
  pub is_code: Option<bool>,
  pub has_emoji: Option<bool>,
  pub has_masked_words: Option<bool>,
  pub image_data_url: Option<String>,
  pub image_path_full_res: Option<String>,
  pub image_height: Option<i32>,
  pub image_width: Option<i32>,
  pub image_hash: Option<String>,
  pub image_type: Option<String>,
  pub image_scale: Option<i32>,
  pub links: Option<String>,
  pub is_image_data: Option<bool>,
  pub is_masked: Option<bool>,
  pub detected_language: Option<String>,
  pub path_type: Option<String>,
  pub is_board: bool,
  pub is_menu: bool,
  pub is_clip: bool,
  pub is_pinned: Option<bool>,
  pub is_favorite: Option<bool>,
  pub is_command: Option<bool>,
  pub is_web_request: Option<bool>,
  pub is_web_scraping: Option<bool>,
  pub is_path: Option<bool>,
  pub is_protected: Option<bool>,
  pub is_disabled: bool,
  pub is_file: Option<bool>,
  pub command_request_output: Option<String>,
  pub command_request_last_run_at: Option<i64>,
  pub request_options: Option<String>,
  pub form_template_options: Option<String>,
  pub color: Option<String>,
  pub border_width: Option<i32>,
  pub layout: Option<String>,
  pub layout_split: i32,
  pub layout_items_max_width: Option<String>,
  pub show_description: Option<bool>,
  pub pinned_order_number: Option<i32>,
  pub icon: Option<String>,
  pub icon_visibility: Option<String>,
  pub created_at: i64,
  pub updated_at: i64,
  pub created_date: NaiveDateTime,
  pub updated_date: NaiveDateTime,
  pub order_number: i32,
  pub parent_id: Option<String>,
  pub tab_id: String,
}

#[derive(Queryable, Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AssociatedMenu {
  pub item_id: String,
  pub name: String,
  pub description: Option<String>,
  pub value: Option<String>,
  pub is_active: bool,
  pub is_deleted: bool,
  pub is_disabled: bool,
  pub is_folder: bool,
  pub is_separator: bool,
  pub is_board: bool,
  pub is_clip: bool,
  pub is_pinned: Option<bool>,
  pub is_favorite: Option<bool>,
  pub is_form: Option<bool>,
  pub is_template: Option<bool>,
  pub is_link: Option<bool>,
  pub is_video: Option<bool>,
  pub is_code: Option<bool>,
  pub is_image: Option<bool>,
  pub is_text: Option<bool>,
  pub has_emoji: Option<bool>,
  pub has_masked_words: Option<bool>,
  pub image_data_url: Option<String>,
  pub image_path_full_res: Option<String>,
  pub image_height: Option<i32>,
  pub image_width: Option<i32>,
  pub image_hash: Option<String>,
  pub image_type: Option<String>,
  pub image_scale: Option<i32>,
  pub links: Option<String>,
  pub is_image_data: Option<bool>,
  pub is_masked: Option<bool>,
  pub detected_language: Option<String>,
  pub path_type: Option<String>,
  pub is_menu: bool,
  pub is_command: Option<bool>,
  pub is_web_request: Option<bool>,
  pub is_web_scraping: Option<bool>,
  pub is_path: Option<bool>,
  pub is_protected: Option<bool>,
  pub is_file: Option<bool>,
  pub command_request_output: Option<String>,
  pub command_request_last_run_at: Option<i64>,
  pub request_options: Option<String>,
  pub form_template_options: Option<String>,
  pub created_at: i64,
  pub updated_at: i64,
  pub created_date: NaiveDateTime,
  pub updated_date: NaiveDateTime,
  pub order_number: i32,
  pub parent_id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatedOnMoveMenuData {
  pub item_id: String,
  pub order_number: i32,
  pub parent_id: Option<String>,
  pub collection_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatedOnMoveClipData {
  pub item_id: String,
  pub order_number: i32,
  pub parent_id: Option<String>,
  pub tab_id: String,
  pub collection_id: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CollectionWithItems {
  pub collection: Collection,
  pub items: Vec<AssociatedMenu>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CollectionWithClips {
  pub collection: Collection,
  pub tabs: Vec<Tabs>,
  pub clips: Vec<AssociatedClips>,
}

pub fn update_moved_clips_in_collection(updated_move_clips: Vec<UpdatedOnMoveClipData>) -> String {
  let connection = &mut establish_pool_db_connection();

  for updated_move_clip in &updated_move_clips {
    let item_id = &updated_move_clip.item_id;
    let order_number = updated_move_clip.order_number;
    let parent_id = &updated_move_clip.parent_id;
    let tab_id = &updated_move_clip.tab_id;
    let collection_id = &updated_move_clip.collection_id;

    let _ = diesel::update(
      collection_clips_dsl::collection_clips
        .filter(collection_clips_dsl::collection_id.eq(collection_id))
        .filter(collection_clips_dsl::item_id.eq(item_id)),
    )
    .set((
      collection_clips_dsl::parent_id.eq(parent_id),
      collection_clips_dsl::tab_id.eq(tab_id),
      collection_clips_dsl::order_number.eq(order_number),
    ))
    .execute(connection);
  }

  "ok".to_string()
}

pub fn update_moved_menu_items_in_collection(
  updated_move_menu_items: Vec<UpdatedOnMoveMenuData>,
) -> Result<String, Error> {
  let connection = &mut establish_pool_db_connection();

  for updated_move_menu_item in &updated_move_menu_items {
    let item_id = &updated_move_menu_item.item_id;
    let order_number = updated_move_menu_item.order_number;
    let parent_id = &updated_move_menu_item.parent_id;
    let collection_id = &updated_move_menu_item.collection_id;

    diesel::update(
      collection_menu_dsl::collection_menu
        .filter(collection_menu_dsl::parent_id.eq(parent_id))
        .filter(collection_menu_dsl::order_number.ge(order_number))
        .filter(collection_menu_dsl::collection_id.eq(collection_id))
        .filter(collection_menu_dsl::item_id.ne(item_id)),
    )
    .set(collection_menu_dsl::order_number.eq(collection_menu_dsl::order_number + 1))
    .execute(connection)?;

    diesel::update(
      collection_menu_dsl::collection_menu.filter(collection_menu_dsl::item_id.eq(item_id)),
    )
    .set((
      collection_menu_dsl::parent_id.eq(parent_id),
      collection_menu_dsl::order_number.eq(order_number),
    ))
    .execute(connection)?;
  }

  Ok("ok".to_string())
}

pub fn update_collection_by_id(
  collection_id_value: String,
  updated_data: UpdatedCollectionData,
) -> String {
  let connection = &mut establish_pool_db_connection();

  use crate::schema::collections::dsl::*;

  let _ = diesel::update(collections.filter(collection_id.eq(&collection_id_value)))
    .set(updated_data)
    .execute(connection);

  "ok".to_string()
}

pub fn select_collection_by_id(collection_id_value: String) -> String {
  let connection = &mut establish_pool_db_connection();

  // Raw SQL query to update is_selected for the target collection and others
  let query = format!(
    r#"
  UPDATE 'collections'
  SET is_selected = CASE
      WHEN collection_id = $1 THEN true
      ELSE false
  END
  "#
  );

  let _ = diesel::sql_query(query)
    .bind::<Text, _>(collection_id_value)
    .execute(connection);

  "ok".to_string()
}

pub fn get_active_collection_with_menu_items() -> Result<CollectionWithItems, Error> {
  let connection = &mut establish_pool_db_connection();

  let collection: Collection = collections_dsl::collections
    .filter(collections_dsl::is_selected.eq(true)) // Filter for active collection
    .first::<Collection>(connection)?;

  let associated_items = CollectionMenu::belonging_to(&collection)
    .inner_join(items.on(items_dsl::item_id.eq(collection_menu_dsl::item_id)))
    .select((
      items_dsl::item_id,
      items_dsl::name,
      items_dsl::description,
      items_dsl::value,
      items_dsl::is_active,
      items_dsl::is_deleted,
      items_dsl::is_disabled,
      items_dsl::is_folder,
      items_dsl::is_separator,
      items_dsl::is_board,
      items_dsl::is_clip,
      items_dsl::is_pinned,
      items_dsl::is_favorite,
      items_dsl::is_form,
      items_dsl::is_template,
      items_dsl::is_link,
      items_dsl::is_video,
      items_dsl::is_code,
      items_dsl::is_image,
      items_dsl::is_text,
      items_dsl::has_emoji,
      items_dsl::has_masked_words,
      items_dsl::image_data_url,
      items_dsl::image_path_full_res,
      items_dsl::image_height,
      items_dsl::image_width,
      items_dsl::image_hash,
      items_dsl::image_type,
      items_dsl::image_scale,
      items_dsl::links,
      items_dsl::is_image_data,
      items_dsl::is_masked,
      items_dsl::detected_language,
      items_dsl::path_type,
      items_dsl::is_menu,
      items_dsl::is_command,
      items_dsl::is_web_request,
      items_dsl::is_web_scraping,
      items_dsl::is_path,
      items_dsl::is_protected,
      items_dsl::is_file,
      items_dsl::command_request_output,
      items_dsl::command_request_last_run_at,
      items_dsl::request_options,
      items_dsl::form_template_options,
      items_dsl::created_at,
      items_dsl::updated_at,
      items_dsl::created_date,
      items_dsl::updated_date,
      collection_menu_dsl::order_number,
      collection_menu_dsl::parent_id,
    ))
    .load::<AssociatedMenu>(connection)?;

  Ok(CollectionWithItems {
    collection,
    items: associated_items,
  })
}

pub fn get_active_collection_with_clips() -> Result<CollectionWithClips, Error> {
  let connection = &mut establish_pool_db_connection();

  let collection: Collection = collections_dsl::collections
    .filter(collections_dsl::is_selected.eq(true)) // Filter for active collection
    .first::<Collection>(connection)?;

  let collection_tabs: Vec<Tabs> = tab_dsl::tabs
    .filter(tab_dsl::collection_id.eq(&collection.collection_id)) // Filter for active collection
    .load::<Tabs>(connection)?;

  let associated_clips = CollectionClips::belonging_to(&collection)
    .inner_join(items.on(items_dsl::item_id.eq(collection_clips_dsl::item_id)))
    .inner_join(tabs.on(tab_dsl::tab_id.eq(collection_clips_dsl::tab_id)))
    .select((
      items_dsl::item_id,
      items_dsl::name,
      items_dsl::description,
      items_dsl::value,
      items_dsl::is_active,
      items_dsl::is_deleted,
      items_dsl::is_folder,
      items_dsl::is_separator,
      items_dsl::is_image,
      items_dsl::is_text,
      items_dsl::is_form,
      items_dsl::is_template,
      items_dsl::is_link,
      items_dsl::is_video,
      items_dsl::is_code,
      items_dsl::has_emoji,
      items_dsl::has_masked_words,
      items_dsl::image_data_url,
      items_dsl::image_path_full_res,
      items_dsl::image_height,
      items_dsl::image_width,
      items_dsl::image_hash,
      items_dsl::image_type,
      items_dsl::image_scale,
      items_dsl::links,
      items_dsl::is_image_data,
      items_dsl::is_masked,
      items_dsl::detected_language,
      items_dsl::path_type,
      items_dsl::is_board,
      items_dsl::is_menu,
      items_dsl::is_clip,
      items_dsl::is_pinned,
      items_dsl::is_favorite,
      items_dsl::is_command,
      items_dsl::is_web_request,
      items_dsl::is_web_scraping,
      items_dsl::is_path,
      items_dsl::is_protected,
      items_dsl::is_disabled,
      items_dsl::is_file,
      items_dsl::command_request_output,
      items_dsl::command_request_last_run_at,
      items_dsl::request_options,
      items_dsl::form_template_options,
      items_dsl::color,
      items_dsl::border_width,
      items_dsl::layout,
      items_dsl::layout_split,
      items_dsl::layout_items_max_width,
      items_dsl::show_description,
      items_dsl::pinned_order_number,
      items_dsl::icon,
      items_dsl::icon_visibility,
      items_dsl::created_at,
      items_dsl::updated_at,
      items_dsl::created_date,
      items_dsl::updated_date,
      collection_clips_dsl::order_number,
      collection_clips_dsl::parent_id,
      tab_dsl::tab_id,
    ))
    .load::<AssociatedClips>(connection);

  Ok(CollectionWithClips {
    collection,
    clips: associated_clips?,
    tabs: collection_tabs,
  })
}

pub fn get_collection(collection_id: &String) -> Option<Collection> {
  let connection = &mut establish_pool_db_connection();

  collections
    .find(collection_id)
    .first::<Collection>(connection)
    .ok()
}

pub fn delete_collection_by_id(collection_id_value: &String, delete_all_items: bool) -> String {
  let connection = &mut establish_pool_db_connection();

  // First delete all items in the collection in delete_all_items is true
  if delete_all_items {
    // Query the collection_menu table to get the list of item IDs

    let item_ids_to_delete: Vec<String> = match collection_menu
      .filter(collection_menu_dsl::collection_id.eq(collection_id_value))
      .select(collection_menu_dsl::item_id)
      .load::<String>(connection)
    {
      Ok(item_ids) => item_ids,
      Err(e) => {
        println!("Error retrieving item IDs: {:?}", e);
        return "Error retrieving item IDs".to_string();
      }
    };

    // Delete items from the items table based on the retrieved item IDs
    let _ = diesel::delete(items.filter(items_dsl::item_id.eq_any(item_ids_to_delete)))
      .execute(connection);
  }

  // Delete from collections table
  let _ =
    diesel::delete(collections.filter(collections_dsl::collection_id.eq(collection_id_value)))
      .execute(connection);

  // Delete from collection_menu table first
  let _ = diesel::delete(
    collection_menu.filter(collection_menu_dsl::collection_id.eq(collection_id_value)),
  )
  .execute(connection);

  // Delete all tabs associated with the collection
  let _ =
    diesel::delete(tabs.filter(tab_dsl::collection_id.eq(collection_id_value))).execute(connection);

  "ok".to_string()
}

pub fn get_collections() -> Result<Vec<Collection>, Error> {
  let connection = &mut establish_pool_db_connection();
  let query = collections.then_order_by(collections_dsl::created_date.desc()); // Then, sort by created_date in ascending order.

  query.load::<Collection>(connection)
}

pub fn create_collection(new_collection: &Collection) -> Result<String, Error> {
  let connection = &mut establish_pool_db_connection();

  match diesel::insert_into(collections::table())
    .values(new_collection)
    .execute(connection)
  {
    Ok(_) => Ok("ok".to_string()),
    Err(e) => {
      eprintln!("Failed to create collection: {}", e);
      Err(e)
    }
  }
}

pub fn add_item_to_collection(
  collection_id: String,
  item_id: String,
  tab_id: String,
  parent_id: Option<String>,
  order_number: i32,
) -> Result<String, diesel::result::Error> {
  let connection = &mut establish_pool_db_connection();

  let new_collection_clip = CollectionClips {
    collection_id,
    item_id,
    tab_id,
    parent_id,
    order_number,
  };

  diesel::insert_into(collection_clips_dsl::collection_clips)
    .values(&new_collection_clip)
    .execute(connection)?;

  Ok("ok".to_string())
}

pub fn add_menu_to_collection(
  collection_id: String,
  item_id: String,
  parent_id: Option<String>,
  order_number: i32,
) -> Result<String, diesel::result::Error> {
  let connection = &mut establish_pool_db_connection();

  let new_collection_item = CollectionMenu {
    collection_id,
    item_id,
    parent_id,
    order_number,
  };

  match diesel::insert_into(collection_menu_dsl::collection_menu)
    .values(&new_collection_item)
    .execute(connection)
  {
    Ok(_) => Ok("ok".to_string()),
    Err(e) => {
      eprintln!("Failed to add menu item to collection: {}", e);
      Err(e)
    }
  }
}

pub fn get_selected_collection_id() -> Result<String, diesel::result::Error> {
  let connection = &mut establish_pool_db_connection();
  // Fetch the collection where is_selected is true
  let selected_collection = collections
    .filter(collections_dsl::is_selected.eq(true))
    .limit(1)
    .load::<Collection>(connection)?
    .pop();

  match selected_collection {
    Some(collection) => Ok(collection.collection_id),
    None => Err(diesel::result::Error::NotFound),
  }
}

pub fn create_default_menu_item(collection_id: String) -> Result<String, diesel::result::Error> {
  let new_item = Item {
    item_id: nanoid::nanoid!(),
    name: "Menu Item".to_string(),
    description: None,
    value: None,
    is_active: true,
    is_deleted: false,
    is_disabled: false,
    is_folder: false,
    is_separator: false,
    is_board: false,
    is_clip: false,
    is_pinned: None,
    image_preview_height: None,
    size: None,
    is_favorite: None,
    is_form: None,
    is_template: None,
    is_link: None,
    is_video: None,
    is_code: None,
    is_image: None,
    is_text: None,
    has_emoji: None,
    has_masked_words: None,
    image_data_url: None,
    image_path_full_res: None,
    image_height: None,
    image_width: None,
    image_hash: None,
    image_type: None,
    image_scale: None,
    links: None,
    is_image_data: None,
    is_masked: None,
    detected_language: None,
    path_type: None,
    is_menu: true,
    is_command: None,
    is_web_request: None,
    is_web_scraping: None,
    is_path: None,
    is_protected: None,
    is_file: None,
    command_request_output: None,
    command_request_last_run_at: None,
    request_options: None,
    form_template_options: None,
    color: None,
    border_width: None,
    layout: None,
    layout_split: 0,
    layout_items_max_width: None,
    show_description: None,
    pinned_order_number: None,
    icon: None,
    icon_visibility: None,
    created_at: chrono::Local::now().timestamp_millis(),
    updated_at: chrono::Local::now().timestamp_millis(),
    created_date: chrono::Local::now().naive_local(),
    updated_date: chrono::Local::now().naive_local(),
  };

  let new_item_id = items_service::create_item(&new_item);

  match add_menu_to_collection(collection_id, new_item_id.clone(), None, 0) {
    Ok(_) => Ok(new_item.item_id),
    Err(e) => Err(e),
  }
}

pub fn create_default_board_item(
  collection_id: String,
  tab_id: String,
) -> Result<String, diesel::result::Error> {
  let new_item = Item {
    item_id: nanoid::nanoid!(),
    name: "Board".to_string(),
    description: None,
    value: None,
    is_active: true,
    is_deleted: false,
    is_disabled: false,
    is_folder: false,
    is_separator: false,
    is_board: true,
    is_clip: false,
    is_pinned: None,
    image_preview_height: None,
    size: None,
    is_favorite: None,
    is_form: None,
    is_template: None,
    is_link: None,
    is_video: None,
    is_code: None,
    is_image: None,
    is_text: None,
    has_emoji: None,
    has_masked_words: None,
    image_data_url: None,
    image_path_full_res: None,
    image_height: None,
    image_width: None,
    image_hash: None,
    image_type: None,
    image_scale: None,
    links: None,
    is_image_data: None,
    is_masked: None,
    detected_language: None,
    path_type: None,
    is_menu: false,
    is_command: None,
    is_web_request: None,
    is_web_scraping: None,
    is_path: None,
    is_protected: None,
    is_file: None,
    command_request_output: None,
    command_request_last_run_at: None,
    request_options: None,
    form_template_options: None,
    color: None,
    border_width: None,
    layout: None,
    layout_split: 0,
    layout_items_max_width: None,
    show_description: None,
    pinned_order_number: None,
    icon: None,
    icon_visibility: None,
    created_at: chrono::Local::now().timestamp_millis(),
    updated_at: chrono::Local::now().timestamp_millis(),
    created_date: chrono::Local::now().naive_local(),
    updated_date: chrono::Local::now().naive_local(),
  };

  let new_item_id = items_service::create_item(&new_item);

  let _ = add_item_to_collection(collection_id, new_item_id.clone(), tab_id, None, 0);

  Ok(new_item.item_id)
}
