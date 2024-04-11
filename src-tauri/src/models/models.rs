use crate::schema::clipboard_history;
use crate::schema::collection_clips;
use crate::schema::collection_menu;
use crate::schema::collections;
use crate::schema::items;
use crate::schema::link_metadata;
use crate::schema::settings;
use crate::schema::tabs;
use chrono::NaiveDateTime;

use diesel::{AsChangeset, Associations, Identifiable, Insertable, Queryable, Selectable};
use serde::{Deserialize, Serialize};

#[derive(
  Queryable, Identifiable, Deserialize, Insertable, Selectable, Debug, PartialEq, Serialize,
)]
#[diesel(primary_key(collection_id))]
#[serde(rename_all = "camelCase")]
#[diesel(table_name = collections)]
pub struct Collection {
  pub collection_id: String,
  pub title: String,
  pub description: Option<String>,
  pub is_default: bool,
  pub is_enabled: bool,
  pub is_selected: bool,

  pub created_at: i64,
  pub updated_at: i64,
  pub created_date: NaiveDateTime,
  pub updated_date: NaiveDateTime,
}

#[derive(AsChangeset, Default, Serialize, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[diesel(table_name = collections)]

pub struct UpdatedCollectionData {
  pub collection_id: Option<String>,
  pub title: Option<String>,
  pub description: Option<String>,
  pub is_enabled: Option<bool>,
}

#[derive(AsChangeset, Default, Serialize, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[diesel(table_name = tabs)]

pub struct UpdatedTabData {
  pub tab_id: Option<String>,
  pub tab_name: Option<String>,
  pub tab_order_number: Option<i32>,
  pub collection_id: Option<String>,
  pub tab_is_active: Option<bool>,
  pub tab_is_hidden: Option<bool>,
  pub tab_color: Option<String>,
  pub tab_layout: Option<String>,
  pub tab_layout_split: Option<i32>,
  pub tab_is_protected: Option<bool>,
}

#[derive(AsChangeset, Default, Serialize, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[diesel(table_name = items)]

pub struct UpdatedItemData {
  pub item_id: Option<String>,
  pub name: Option<String>,
  pub description: Option<String>,
  pub value: Option<String>,
  pub is_active: Option<bool>,
  pub show_description: Option<bool>,
  pub size: Option<String>,
  pub layout: Option<String>,
  pub layout_items_max_width: Option<String>,
  pub layout_split: Option<i32>,
  pub color: Option<String>,
  pub border_width: Option<i32>,
  pub is_pinned: Option<bool>,
  pub is_favorite: Option<bool>,
  pub is_code: Option<bool>,
  pub is_disabled: Option<bool>,
  pub is_deleted: Option<bool>,
  pub is_text: Option<bool>,
  pub is_form: Option<bool>,
  pub is_template: Option<bool>,
  pub is_image: Option<bool>,
  pub image_scale: Option<i32>,
  pub image_hash: Option<String>,
  pub is_command: Option<bool>,
  pub is_web_request: Option<bool>,
  pub is_web_scraping: Option<bool>,
  pub is_path: Option<bool>,
  pub is_link: Option<bool>,
  pub is_video: Option<bool>,
  pub is_masked: Option<bool>,
  pub is_menu: Option<bool>,
  pub has_emoji: Option<bool>,
  pub path_type: Option<String>,
  pub icon: Option<String>,
  pub icon_visibility: Option<String>,
  pub detected_language: Option<String>,
  pub pinned_order_number: Option<i32>,
  pub command_request_output: Option<String>,
  pub command_request_last_run_at: Option<i64>,
  pub request_options: Option<String>,
  pub form_template_options: Option<String>,
}

#[derive(AsChangeset, Default, Serialize, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[diesel(table_name = clipboard_history)]
pub struct UpdatedHistoryData {
  pub history_id: Option<String>,
  pub title: Option<String>,
  pub value: Option<String>,
  pub is_text: Option<bool>,
  pub is_code: Option<bool>,
  pub is_masked: Option<bool>,
  pub detected_language: Option<String>,
  pub is_link: Option<bool>,
  pub is_video: Option<bool>,
  pub has_emoji: Option<bool>,
  pub has_masked_words: Option<bool>,
  pub is_pinned: Option<bool>,
  pub is_favorite: Option<bool>,
  pub pinned_order_number: Option<i32>,
}

#[derive(
  Queryable, Identifiable, Deserialize, Insertable, Selectable, Debug, PartialEq, Serialize, Clone,
)]
#[diesel(primary_key(item_id))]
#[serde(rename_all = "camelCase")]
#[diesel(table_name = items)]
pub struct Item {
  pub item_id: String,
  pub name: String,
  pub description: Option<String>,
  pub value: Option<String>,
  pub color: Option<String>,
  pub border_width: Option<i32>,
  pub is_image: Option<bool>,
  pub image_path_full_res: Option<String>,
  pub image_preview_height: Option<i32>,
  pub image_height: Option<i32>,
  pub image_width: Option<i32>,
  pub image_data_url: Option<String>,
  pub image_type: Option<String>,
  pub image_hash: Option<String>,
  pub image_scale: Option<i32>,
  pub is_image_data: Option<bool>,
  pub is_masked: Option<bool>,
  pub is_text: Option<bool>,
  pub is_form: Option<bool>,
  pub is_template: Option<bool>,
  pub is_code: Option<bool>,
  pub is_link: Option<bool>,
  pub is_path: Option<bool>,
  pub is_file: Option<bool>,
  pub is_protected: Option<bool>,
  pub is_pinned: Option<bool>,
  pub is_favorite: Option<bool>,
  pub is_command: Option<bool>,
  pub is_web_request: Option<bool>,
  pub is_web_scraping: Option<bool>,
  pub is_video: Option<bool>,
  pub has_emoji: Option<bool>,
  pub has_masked_words: Option<bool>,
  pub path_type: Option<String>,
  pub icon: Option<String>,
  pub icon_visibility: Option<String>,
  pub command_request_output: Option<String>,
  pub command_request_last_run_at: Option<i64>,
  pub request_options: Option<String>,
  pub form_template_options: Option<String>,
  pub links: Option<String>,
  pub detected_language: Option<String>,
  pub is_active: bool,
  pub is_disabled: bool,
  pub is_deleted: bool,
  pub is_folder: bool,
  pub is_separator: bool,
  pub is_board: bool,
  pub is_menu: bool,
  pub is_clip: bool,
  pub size: Option<String>,
  pub layout: Option<String>,
  pub layout_items_max_width: Option<String>,
  pub layout_split: i32,
  pub show_description: Option<bool>,
  pub pinned_order_number: Option<i32>,
  pub created_at: i64,
  pub updated_at: i64,
  pub created_date: NaiveDateTime,
  pub updated_date: NaiveDateTime,
}

#[derive(
  Queryable, Identifiable, Deserialize, Insertable, Associations, Debug, PartialEq, Serialize,
)]
#[diesel(belongs_to(Collection))]
#[diesel(belongs_to(Item))]
#[serde(rename_all = "camelCase")]
#[diesel(primary_key(collection_id, item_id))]
#[diesel(table_name = collection_menu)]
pub struct CollectionMenu {
  pub collection_id: String,
  pub item_id: String,
  pub parent_id: Option<String>,
  pub order_number: i32,
}

#[derive(
  Queryable, Identifiable, Deserialize, Insertable, Associations, Debug, PartialEq, Serialize,
)]
#[diesel(belongs_to(Collection))]
#[diesel(belongs_to(Item))]
#[serde(rename_all = "camelCase")]
#[diesel(primary_key(collection_id, item_id))]
#[diesel(table_name = collection_clips)]
pub struct CollectionClips {
  pub collection_id: String,
  pub item_id: String,
  pub tab_id: String,
  pub parent_id: Option<String>,
  pub order_number: i32,
}

#[derive(
  Queryable, Identifiable, Deserialize, Insertable, Selectable, Debug, PartialEq, Serialize,
)]
#[diesel(primary_key(history_id))]
#[serde(rename_all = "camelCase")]
#[diesel(table_name = clipboard_history)]
pub struct ClipboardHistory {
  pub history_id: String,
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

  pub created_at: i64,
  pub updated_at: i64,
  pub created_date: NaiveDateTime,
  pub updated_date: NaiveDateTime,
}

#[derive(
  Queryable, AsChangeset, Deserialize, Insertable, Selectable, Debug, Clone, PartialEq, Serialize,
)]
#[serde(rename_all = "camelCase")]
#[diesel(table_name = settings)]

pub struct Setting {
  pub name: String,
  pub value_text: Option<String>,
  pub value_bool: Option<bool>,
  pub value_int: Option<i32>,
}

#[derive(
  Queryable, AsChangeset, Deserialize, Insertable, Selectable, Debug, Clone, PartialEq, Serialize,
)]
#[serde(rename_all = "camelCase")]
#[diesel(table_name = link_metadata)]
pub struct LinkMetadata {
  pub metadata_id: String,
  pub history_id: Option<String>,
  pub item_id: Option<String>,
  pub link_url: Option<String>,
  pub link_title: Option<String>,
  pub link_description: Option<String>,
  pub link_image: Option<String>,
  pub link_domain: Option<String>,
  pub link_favicon: Option<String>,
}

#[derive(
  Queryable, AsChangeset, Deserialize, Insertable, Selectable, Debug, Clone, PartialEq, Serialize,
)]
#[serde(rename_all = "camelCase")]
#[diesel(table_name = tabs)]

pub struct Tabs {
  pub tab_id: String,
  pub collection_id: String,
  pub tab_name: String,
  pub tab_is_active: bool,
  pub tab_is_hidden: bool,
  pub tab_order_number: i32,
  pub tab_color: Option<String>,
  pub tab_layout: Option<String>,
  pub tab_layout_split: i32,
  pub tab_is_protected: bool,
}
