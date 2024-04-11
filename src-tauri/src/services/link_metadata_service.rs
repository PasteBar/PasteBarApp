use crate::{
  db::establish_pool_db_connection, models::models::LinkMetadata, schema::link_metadata::dsl::*,
};

use diesel::prelude::*;
use nanoid::nanoid;

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
