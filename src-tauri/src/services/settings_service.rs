use diesel::prelude::*;
use diesel::result::Error;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::Manager;

use crate::db::establish_pool_db_connection;
use crate::db::DB_POOL_CONNECTION;
use crate::models::Setting;

use crate::schema::settings::dsl::*;

pub fn get_all_settings(
  app_handle: Option<tauri::AppHandle>,
) -> Result<Mutex<HashMap<String, Setting>>, Error> {
  let connection = &mut establish_pool_db_connection();
  let settings_options: Vec<Setting> = settings
    .load::<Setting>(connection)
    .expect("Error loading settings options");

  let new_settings: HashMap<String, Setting> = settings_options
    .into_iter()
    .map(|s| (s.name.clone(), s))
    .collect();

  if let Some(handle) = app_handle {
    let app_settings_mutex = handle.state::<Mutex<HashMap<String, Setting>>>();
    let mut app_settings = app_settings_mutex
      .lock()
      .expect("Failed to lock app_settings");

    *app_settings = new_settings.clone();
  }

  Ok(Mutex::new(new_settings))
}

pub fn insert_or_update_setting_by_name(
  setting: &Setting,
  app_handle: tauri::AppHandle,
) -> Result<String, Error> {
  let connection = &mut DB_POOL_CONNECTION.get().unwrap();

  match settings
    .filter(name.eq(&setting.name))
    .first::<Setting>(connection)
  {
    Ok(existing_setting) => {
      diesel::update(settings.find(existing_setting.name))
        .set((
          name.eq(&setting.name),
          value_text.eq(&setting.value_text),
          value_bool.eq(&setting.value_bool),
          value_int.eq(&setting.value_int),
        ))
        .execute(connection)?;
    }
    Err(diesel::NotFound) => {
      diesel::insert_into(settings)
        .values(setting)
        .execute(connection)?;
    }
    Err(e) => return Err(e),
  }

  get_all_settings(Some(app_handle)).unwrap_or_default();

  Ok("ok".to_string())
}
