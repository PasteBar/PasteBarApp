use regex::Regex;
use serde::{Deserialize, Serialize};
use tauri::{CustomMenuItem, SystemTrayMenu, SystemTrayMenuItem, SystemTraySubmenu};

use crate::models::{ClipboardHistory, Setting};
use crate::services::utils::{debug_output, mask_value};
use crate::services::{collections_service, history_service};

use crate::services::translations::translations::Translations;

use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;
pub struct DbItems(pub Mutex<Vec<collections_service::AssociatedMenu>>);
pub struct DbRecentHistoryItems(pub Mutex<Vec<ClipboardHistory>>);

#[derive(Serialize, Deserialize, Debug)]
pub struct MenuStructure {
  pub title: String,
  pub id: String,
  pub tooltip: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AssociatedItemTree {
  pub item: collections_service::AssociatedMenu,
  pub children: Vec<AssociatedItemTree>,
}

#[tauri::command]
pub fn build_system_menu(
  app_handle: tauri::AppHandle,
  db_items_state: tauri::State<DbItems>,
  db_recent_history_items_state: tauri::State<DbRecentHistoryItems>,
  app_settings: tauri::State<Mutex<HashMap<String, Setting>>>,
) {
  update_system_menu(
    &app_handle,
    db_items_state,
    db_recent_history_items_state,
    app_settings,
  )
  .unwrap()
}

pub fn update_system_menu(
  app_handle: &tauri::AppHandle,
  db_items_state: State<DbItems>,
  db_recent_history_items_state: State<DbRecentHistoryItems>,
  app_settings: State<Mutex<HashMap<String, Setting>>>,
) -> Result<(), String> {
  match build_tray_menu(db_items_state, db_recent_history_items_state, app_settings) {
    Ok(tray_menu) => {
      // 2. If the result is Ok, use the SystemTrayMenu to set the menu for the tray
      let _ = app_handle.tray_handle().set_menu(tray_menu);
      Ok(())
    }
    Err(error_msg) => {
      // 3. If the result is Err, handle the error
      Err(format!("Failed to build tray menu: {}", error_msg))
    }
  }
}

fn get_active_collection_with_menu_items(
) -> Result<Vec<collections_service::AssociatedMenu>, diesel::result::Error> {
  let collection_with_items = collections_service::get_active_collection_with_menu_items()?;
  Ok(collection_with_items.items)
}

fn build_tree(
  items: &[collections_service::AssociatedMenu],
  parent_id: &Option<String>,
) -> Vec<AssociatedItemTree> {
  let mut filtered_and_sorted: Vec<_> = items
    .iter()
    .filter(|&item| item.parent_id == *parent_id && !item.is_deleted && item.is_active)
    .collect(); // Collect the filtered items into a vector

  filtered_and_sorted.sort_by(|a, b| a.order_number.cmp(&b.order_number)); // Sorting the vector based on order_number

  filtered_and_sorted
    .iter()
    .map(|&item| {
      let children = build_tree(items, &Some(item.item_id.clone()));
      AssociatedItemTree {
        item: item.clone(),
        children,
      }
    })
    .collect::<Vec<AssociatedItemTree>>()
}

fn add_items_to_menu(
  menu: SystemTrayMenu,
  items: &[AssociatedItemTree],
  is_app_locked: bool,
) -> SystemTrayMenu {
  let mut current_menu = menu;

  for item_tree in items {
    let item = &item_tree.item;

    if item.is_separator {
      current_menu = current_menu.add_native_item(SystemTrayMenuItem::Separator);
    } else if item.is_folder {
      if is_app_locked {
        let submenu_item = CustomMenuItem::new(&item.item_id, &item.name);
        current_menu = current_menu.add_item(submenu_item.disabled());
      } else {
        let submenu = add_items_to_menu(SystemTrayMenu::new(), &item_tree.children, is_app_locked);
        let submenu_item = SystemTraySubmenu::new(&item.name, submenu);
        current_menu = current_menu.add_submenu(submenu_item);
      }
    } else {
      let custom_item = CustomMenuItem::new(&item.item_id, &item.name);
      if item.is_disabled || is_app_locked {
        current_menu = current_menu.add_item(custom_item.disabled());
      } else {
        current_menu = current_menu.add_item(custom_item);
      }
    }
  }

  current_menu
}

pub fn build_tray_menu(
  db_items_state: State<DbItems>,
  db_recent_history_items_state: State<DbRecentHistoryItems>,
  app_settings: State<Mutex<HashMap<String, Setting>>>,
) -> Result<SystemTrayMenu, String> {
  let db_items_result = get_active_collection_with_menu_items();
  let db_recent_history_items_result = match history_service::get_recent_clipboard_histories(10) {
    Ok(items) => items,
    Err(_) => Vec::new(),
  };

  let settings_map = app_settings.lock().unwrap();

  let mut is_history_enabled = true;
  let mut is_app_locked = false;

  if let Some(setting) = settings_map.get("isAppLocked") {
    if let Some(value_bool) = setting.value_bool {
      is_app_locked = value_bool;
    }
  }

  if let Some(setting) = settings_map.get("isHistoryEnabled") {
    if let Some(value_bool) = setting.value_bool {
      is_history_enabled = value_bool;
    }
  }

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

  match db_items_result {
    Ok(db_items) => {
      let tree = build_tree(&db_items, &None);
      let menu = build_system_tray_menu(
        &tree,
        &db_recent_history_items_result,
        is_history_enabled,
        is_app_locked,
        auto_mask_words_list,
      );
      let mut locked_state = db_items_state.0.lock().unwrap();
      *locked_state = db_items;
      let mut locked_recent_history_state = db_recent_history_items_state.0.lock().unwrap();
      *locked_recent_history_state = db_recent_history_items_result;

      Ok(menu)
    }
    Err(e) => {
      println!("Error retrieving items from the database: {:?}", e);
      Err("Failed to retrieve items from database".to_string())
    }
  }
}

fn build_system_tray_menu(
  tree: &[AssociatedItemTree],
  recent_history: &Vec<ClipboardHistory>,
  is_history_enabled: bool,
  is_app_locked: bool,
  auto_mask_words_list: Vec<String>,
) -> SystemTrayMenu {
  let mut menuitem_quit = CustomMenuItem::new("quit".to_string(), Translations::get("quit"));
  let mut menuitem_show =
    CustomMenuItem::new("open".to_string(), Translations::get("open_pastebar"));

  if is_app_locked {
    menuitem_show = CustomMenuItem::new("open".to_string(), Translations::get("unlock_pastebar"));
  }

  #[cfg(target_os = "macos")]
  {
    menuitem_quit = menuitem_quit.accelerator("CmdOrCtrl+Q");
    menuitem_show = menuitem_show.accelerator("CmdOrCtrl+O");
  }

  let mut menu = SystemTrayMenu::new();

  #[cfg(target_os = "macos")]
  {
    menu = menu.add_item(menuitem_show);
    if !recent_history.is_empty() {
      if let Some(history_menu) =
        add_recent_history_items_to_menu(recent_history, auto_mask_words_list, is_history_enabled)
      {
        if is_app_locked {
          menu = menu.add_item(
            CustomMenuItem::new(
              "history_is_disabled".to_string(),
              Translations::get("recent_history"),
            )
            .disabled(),
          );
        } else {
          menu = menu.add_submenu(SystemTraySubmenu::new(
            Translations::get("recent_history"),
            history_menu,
          ));
        }
        menu = menu.add_native_item(SystemTrayMenuItem::Separator);
      }
    }
  }

  if tree.is_empty() {
    let add_first_menu = CustomMenuItem::new(
      "add_first_menu_item".to_string(),
      Translations::get("add_first_item_here"),
    );

    menu = menu.add_item(add_first_menu);
  } else {
    menu = add_items_to_menu(menu, tree, is_app_locked);
  }

  menu = menu.add_native_item(SystemTrayMenuItem::Separator);

  #[cfg(target_os = "windows")]
  {
    if !recent_history.is_empty() {
      if let Some(history_menu) =
        add_recent_history_items_to_menu(recent_history, auto_mask_words_list, is_history_enabled)
      {
        if is_app_locked {
          menu = menu.add_item(
            CustomMenuItem::new(
              "history_is_disabled".to_string(),
              Translations::get("recent_history"),
            )
            .disabled(),
          );
        } else {
          menu = menu.add_submenu(SystemTraySubmenu::new(
            Translations::get("recent_history"),
            history_menu,
          ));
        }
      }
    }
    menu = menu.add_item(menuitem_show);
  }

  menu = menu.add_item(menuitem_quit);

  menu
}

fn add_recent_history_items_to_menu(
  recent_history: &[ClipboardHistory],
  auto_mask_words_list: Vec<String>,
  is_history_enabled: bool,
) -> Option<SystemTrayMenu> {
  let history_items = create_recent_history_items(recent_history, auto_mask_words_list);
  if !history_items.is_empty() {
    let mut history_submenu = SystemTrayMenu::new();

    if !is_history_enabled {
      let menu_item = CustomMenuItem::new(
        "history_is_disabled".to_string(),
        Translations::get("history_capture_is_disabled"),
      )
      .disabled();

      history_submenu = history_submenu.add_item(menu_item);
    }

    for item in history_items {
      history_submenu = history_submenu.add_item(item);
    }
    history_submenu = history_submenu.add_native_item(SystemTrayMenuItem::Separator);

    let (item_id, item_label) = if is_history_enabled {
      (
        "disable_history_capture",
        Translations::get("disable_history_capture"),
      )
    } else {
      (
        "enable_history_capture",
        Translations::get("enable_history_capture"),
      )
    };

    #[cfg(target_os = "windows")]
    let menu_item = CustomMenuItem::new(item_id.to_string(), item_label);

    #[cfg(target_os = "macos")]
    let menu_item = CustomMenuItem::new(item_id.to_string(), item_label).accelerator("CmdOrCtrl+H");

    history_submenu = history_submenu.add_item(menu_item);

    Some(history_submenu)
  } else {
    None
  }
}

fn create_recent_history_items(
  recent_history: &[ClipboardHistory],
  auto_mask_words_list: Vec<String>,
) -> Vec<CustomMenuItem> {
  // Precompile the regex patterns for each word in auto_mask_words_list
  let regex_patterns: Vec<Regex> = auto_mask_words_list
    .iter()
    .map(|word| Regex::new(&format!(r"(?i){}", regex::escape(word))).unwrap())
    .collect();

  recent_history
    .iter()
    .enumerate()
    .map(|(index, item)| {
      let value = item
        .value
        .as_ref()
        .unwrap_or(&"".to_string())
        .trim()
        .split_whitespace()
        .collect::<Vec<&str>>()
        .join(" ");

      let title = if let Some(true) = item.is_image {
        format!(
          "{} {}x{}",
          Translations::get("clipboard_image_size"),
          item.image_width.unwrap_or_default(),
          item.image_height.unwrap_or_default()
        )
      } else if value.chars().count() > 35 {
        format!("{}...", value.chars().take(35).collect::<String>())
      } else {
        value
      };

      let final_title = if item.is_masked == Some(true) {
        let mut masked_title = title.clone();
        mask_value(&mut masked_title)
      } else if !auto_mask_words_list.is_empty() && item.has_masked_words == Some(true) {
        let mut title_value = title.clone();

        for (word, pattern) in auto_mask_words_list.iter().zip(&regex_patterns) {
          let masked_word = mask_value(&mut word.clone());
          title_value = pattern.replace_all(&title_value, &masked_word).to_string();
        }

        title_value
      } else {
        title
      };

      let item_number = ((index + 1) % 10).to_string();

      #[cfg(target_os = "windows")]
      {
        CustomMenuItem::new(item.history_id.clone(), final_title)
      }

      #[cfg(target_os = "macos")]
      {
        CustomMenuItem::new(item.history_id.clone(), final_title).accelerator(&item_number)
      }
    })
    .collect()
}
