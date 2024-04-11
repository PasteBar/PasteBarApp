use crate::{
  db::establish_pool_db_connection,
  models::models::{Tabs, UpdatedTabData},
  schema::tabs::dsl::*,
};

use nanoid::nanoid;

use diesel::{associations::HasTable, prelude::*};
use serde::{Deserialize, Serialize};

#[derive(Queryable, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateTab {
  pub tab_name: String,
  pub tab_order_number: i32,
  pub collection_id: String,
  pub tab_color: Option<String>,
}

pub fn create_new_tab(tab: &Tabs) -> Result<String, diesel::result::Error> {
  let connection = &mut establish_pool_db_connection();

  let _ = diesel::insert_into(tabs::table())
    .values(tab)
    .execute(connection);

  Ok(tab.tab_id.clone())
}

pub fn update_tab_by_id(tab_id_value: String, updated_data: UpdatedTabData) -> String {
  let connection = &mut establish_pool_db_connection();

  let _ = diesel::update(tabs.filter(tab_id.eq(&tab_id_value)))
    .set(updated_data)
    .execute(connection);

  "ok".to_string()
}

pub fn delete_tab_by_tab_id(tab_id_value: &String) -> String {
  let connection = &mut establish_pool_db_connection();

  let _ = diesel::delete(tabs.filter(tab_id.eq(tab_id_value))).execute(connection);

  "ok".to_string()
}

pub fn get_tabs_by_collection_id(
  collection_id_value: &String,
) -> Result<Vec<Tabs>, diesel::result::Error> {
  let connection = &mut establish_pool_db_connection();

  tabs
    .filter(collection_id.eq(collection_id_value))
    .load::<Tabs>(connection)
}

pub fn get_tab_by_tab_id(tab_id_value: &String) -> Result<Option<Tabs>, diesel::result::Error> {
  let connection = &mut establish_pool_db_connection();

  tabs
    .filter(tab_id.eq(tab_id_value))
    .first(connection)
    .optional()
}

pub fn create_default_tab(collection_id_value: String) -> Result<String, diesel::result::Error> {
  let default_tab = Tabs {
    tab_id: nanoid!().to_string(),
    collection_id: collection_id_value,
    tab_name: "Tab".to_string(),
    tab_is_active: true,
    tab_is_hidden: false,
    tab_order_number: 0,
    tab_color: None,
    tab_layout: None,
    tab_layout_split: 2,
    tab_is_protected: false,
  };

  match create_new_tab(&default_tab) {
    Ok(_) => {}
    Err(e) => return Err(e),
  }

  Ok(default_tab.tab_id)
}
