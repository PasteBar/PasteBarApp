#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

use auto_launch::AutoLaunchBuilder;
use dotenv::dotenv;
use menu::DbRecentHistoryItems;
use opener;
use services::settings_service::insert_or_update_setting_by_name;
use services::utils;
use services::utils::debug_output;
// use simple_cache::SimpleCache;
use std::env::current_exe;
use std::fs;
use std::thread;
use tauri::Menu;
use tauri::MenuItem;
use tauri::Submenu;

#[cfg(target_os = "macos")]
use window_ext::WindowToolBar;

#[cfg(target_os = "macos")]
mod window_ext;

mod clipboard;
mod commands;
mod constants;
mod cron_jobs;
mod db;
mod helpers;
mod menu;
mod metadata;
mod models;
mod schema;
mod services;
mod simple_cache;

use crate::commands::clipboard_commands::copy_paste_clip_item_from_menu;
use crate::commands::clipboard_commands::write_image_to_clipboard;
use crate::menu::DbItems;
use crate::models::Setting;
use crate::services::history_service;
use crate::services::settings_service::get_all_settings;
use crate::services::translations::translations::Translations;
use crate::services::utils::ensure_url_or_email_prefix;
use crate::services::utils::remove_special_bbcode_tags;
use commands::clipboard_commands;
use commands::collections_commands;
use commands::history_commands;
use commands::items_commands;
use commands::link_metadata_commands;
use commands::request_commands;
use commands::security_commands;
use commands::shell_commands;
use commands::tabs_commands;
use commands::translations_commands;
use db::AppConstants;
use std::collections::HashMap;

use serde::Serialize;
use tauri::ClipboardManager;
use tauri::Manager;
use tauri::SystemTray;
use tauri::SystemTrayEvent;
// use tauri_plugin_positioner::{Position, WindowExt};

use inputbot::KeybdKey::*;
use std::sync::Mutex;
use std::time::Duration as StdDuration;
use std::time::Instant;
use tauri_plugin_window_state::AppHandleExt;
use tauri_plugin_window_state::StateFlags;
use tokio::sync::Mutex as TokioMutex;

#[derive(Serialize)]
struct AppReadyResponse<'a> {
  permissionstrusted: bool,
  constants: &'a AppConstants<'a>,
  settings: &'a Mutex<HashMap<String, Setting>>,
}

#[derive(Clone, serde::Serialize)]
struct SettingUpdatePayload {
  name: String,
  value_bool: Option<bool>,
  value_string: Option<String>,
  value_number: Option<i32>,
}

#[tauri::command]
fn open_path_or_app(path: String) -> Result<(), String> {
  opener::open(path).map_err(|e| format!("Failed to open path: {}", e))
}

#[tauri::command]
fn get_device_id() -> Result<String, String> {
  match mid::get("PasteBarApp") {
    Ok(id) => {
      debug_output(|| {
        println!("Device ID: {}", &id[..24]);
      });
      Ok(id[..24].to_string())
    }
    Err(e) => Err(e.to_string()),
  }
}

#[tauri::command]
fn update_setting(setting: Setting, app_handle: tauri::AppHandle) -> Result<String, String> {
  match insert_or_update_setting_by_name(&setting, app_handle) {
    Ok(result) => Ok(result),
    Err(err) => Err(err.to_string()),
  }
}

#[tauri::command]
fn is_autostart_enabled() -> Result<bool, bool> {
  let current_exe = current_exe().unwrap();

  let auto_start = AutoLaunchBuilder::new()
    .set_app_name("PasteBar")
    .set_app_path(&current_exe.to_str().unwrap())
    .set_use_launch_agent(true)
    .build()
    .unwrap();

  Ok(auto_start.is_enabled().unwrap())
}

#[tauri::command]
fn autostart(enabled: bool) -> Result<bool, bool> {
  let current_exe = current_exe().unwrap();

  let auto_start = AutoLaunchBuilder::new()
    .set_app_name("PasteBar")
    .set_app_path(&current_exe.to_str().unwrap())
    .set_use_launch_agent(true)
    .build()
    .unwrap();

  if enabled {
    auto_start.enable().unwrap();
  } else {
    auto_start.disable().unwrap();
  }

  Ok(auto_start.is_enabled().unwrap())
}

#[tauri::command]
fn app_ready(app_handle: tauri::AppHandle) -> Result<String, String> {
  let window = app_handle.get_window("main").unwrap();

  let current_size = window.inner_size().unwrap();
  let mut new_size = current_size;

  if current_size.width < 600 {
    new_size.width = 600;
  }
  if current_size.height < 550 {
    new_size.height = 550;
  }

  if new_size != current_size {
    window.set_size(new_size).unwrap();
  }

  window.show().unwrap();

  debug_output(|| {
    println!("app_ready on client");
  });

  let constants = db::APP_CONSTANTS
    .get()
    .ok_or("APP_CONSTANTS not initialized")?;

  let app_settings = app_handle.state::<Mutex<HashMap<String, Setting>>>();
  let mut is_permissions_trusted = true;

  #[cfg(target_os = "macos")]
  {
    is_permissions_trusted =
      macos_accessibility_client::accessibility::application_is_trusted_with_prompt();

    debug_output(|| {
      println!("Application is trusted: {}", is_permissions_trusted);
    });
  }

  let response = AppReadyResponse {
    constants: constants,
    permissionstrusted: is_permissions_trusted,
    settings: &app_settings,
  };

  let serialized = serde_json::to_string(&response).map_err(|e| e.to_string())?;

  Ok(serialized)
}

#[tauri::command]
fn open_osx_accessibility_preferences() {
  #[cfg(target_os = "macos")]
  {
    let url = "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";
    if let Err(err) = opener::open(url) {
      eprintln!("Failed to open URL: {}", err);
    }
  }
}

#[tauri::command]
fn check_osx_accessibility_preferences() -> bool {
  #[cfg(target_os = "macos")]
  {
    macos_accessibility_client::accessibility::application_is_trusted_with_prompt()
  }

  #[cfg(target_os = "windows")]
  {
    true
  }
}

#[tauri::command]
fn set_icon(app_handle: tauri::AppHandle, name: &str, is_dark: bool) {
  let _ = app_handle.tray_handle().set_tooltip("PasteBar");
  let is_windows_system_dark_mode = utils::is_windows_system_uses_dark_theme();

  match name {
    "notification" => {
      app_handle
        .tray_handle()
        .set_icon(if cfg!(windows) {
          if is_dark || is_windows_system_dark_mode {
            tauri::Icon::Raw(include_bytes!("../icons/tray128x128-white-notification.png").to_vec())
          } else {
            tauri::Icon::Raw(include_bytes!("../icons/tray128x128-notification.png").to_vec())
          }
        } else {
          tauri::Icon::Raw(include_bytes!("../icons/tray128x128-notification.png").to_vec())
        })
        .unwrap();
    }
    _ => app_handle
      .tray_handle()
      .set_icon(if cfg!(windows) {
        if is_dark || is_windows_system_dark_mode {
          tauri::Icon::Raw(include_bytes!("../icons/tray128x128-white.png").to_vec())
        } else {
          tauri::Icon::Raw(include_bytes!("../icons/tray128x128.png").to_vec())
        }
      } else {
        tauri::Icon::Raw(include_bytes!("../icons/tray128x128.png").to_vec())
      })
      .unwrap(),
  }
}

#[tokio::main]
async fn main() {
  dotenv().ok();
  let db_items_state = DbItems(Mutex::new(Vec::new()));
  let db_recent_history_items_state = DbRecentHistoryItems(Mutex::new(Vec::new()));
  tauri_plugin_deep_link::prepare("app.anothervision.pasteBar");

  tauri::Builder::default()
    .manage(db_items_state)
    .manage(db_recent_history_items_state)
    .on_system_tray_event(move |app, event| match event {
      SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
        "quit" => {
          app.save_window_state(StateFlags::all()).unwrap();
          let w = app.get_window("main").unwrap();
          w.close().unwrap();
          app.exit(0);
        }
        "open" => {
          let w = app.get_window("main").unwrap();
          w.show().unwrap();
          w.set_focus().unwrap();
        }
        "add_first_menu_item" => {
          let w = app.get_window("main").unwrap();
          w.show().unwrap();
          w.set_focus().unwrap();
          w.emit("menu:add_first_menu_item", {}).unwrap();
        }
        "disable_history_capture" => {
          let w = app.get_window("main").unwrap();
          w.emit(
            "setting:update",
            SettingUpdatePayload {
              name: "isHistoryEnabled".to_string(),
              value_number: None,
              value_string: None,
              value_bool: Some(false),
            },
          )
          .unwrap();
        }
        "enable_history_capture" => {
          let w = app.get_window("main").unwrap();
          w.emit(
            "setting:update",
            SettingUpdatePayload {
              name: "isHistoryEnabled".to_string(),
              value_bool: Some(true),
              value_number: None,
              value_string: None,
            },
          )
          .unwrap();
        }

        item_id => {
          debug_output(|| {
            println!("system tray received a click on item id{:?} ", item_id);
          });
          let w = app.get_window("main").unwrap();
          let state: tauri::State<DbItems> = app.state::<DbItems>();
          let db_items_state = state.0.lock().unwrap();

          let item_opt = db_items_state.iter().find(|&item| item.item_id == item_id);

          if let Some(item) = item_opt {
            debug_output(|| {
              println!(
                "Found item in db_items_state with value: {:?} ",
                &item.value
              );
            });

            let mut manager = app.clipboard_manager();

            if !item.is_clip {
              if let (Some(true), Some(false)) = (item.is_image, item.is_link) {
                let image_path = match &item.image_path_full_res {
                  Some(path) => path,
                  None => return (),
                };

                let img_data = std::fs::read(&image_path).expect("Failed to read image from path");
                let base64_image = base64::encode(&img_data);

                write_image_to_clipboard(base64_image).expect("Failed to write image to clipboard");
              }
              if item.is_link.unwrap_or(false) {
                let url = item.value.as_deref().unwrap_or("");
                let _ = opener::open(ensure_url_or_email_prefix(url))
                  .map_err(|e| format!("Failed to open url: {}", e));
              } else if item.is_path.unwrap_or(false) {
                let path = item.value.as_deref().unwrap_or("");
                let _ = opener::open(path).map_err(|e| format!("Failed to open path: {}", e));
              } else {
                if item.value.as_deref().unwrap_or("").is_empty() {
                  manager
                    .write_text(&item.name)
                    .expect("failed to write to clipboard");
                } else if let Some(ref item_value) = item.value {
                  manager
                    .write_text(remove_special_bbcode_tags(item_value))
                    .expect("failed to write to clipboard");
                }
              }

              #[cfg(target_os = "windows")]
              {
                thread::sleep(StdDuration::from_secs(3));
              }

              #[cfg(target_os = "macos")]
              fn query_accessibility_permissions() -> bool {
                macos_accessibility_client::accessibility::application_is_trusted_with_prompt()
              }

              #[cfg(target_os = "windows")]
              fn query_accessibility_permissions() -> bool {
                return true;
              }

              #[cfg(any(target_os = "windows", target_os = "macos"))]
              if query_accessibility_permissions() {
                VKey.press_paste();
              } else {
                w.show().unwrap();
                w.emit("macosx-permissions-modal", "show").unwrap();
              }

              w.emit("execMenuItemById", item_id).unwrap();
            } else {
              let app_clone = app.clone();
              let item_id_string = item_id.to_string();

              thread::spawn(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();

                let delay = if cfg!(target_os = "windows") { 3 } else { 0 };

                rt.block_on(async {
                  copy_paste_clip_item_from_menu(app_clone, item_id_string, delay).await;
                });
              });
            }
          } else {
            let recent_history_state: tauri::State<DbRecentHistoryItems> =
              app.state::<DbRecentHistoryItems>();
            let db_recent_history_items_state = recent_history_state.0.lock().unwrap();

            if let Some(history_item) = db_recent_history_items_state
              .iter()
              .find(|&item| item.history_id == item_id)
            {
              let detailed_history_item =
                history_service::get_clipboard_history_by_id(&history_item.history_id);

              if detailed_history_item.is_none() {
                debug_output(|| {
                  println!("History item not found");
                });
              }

              let detailed_history_item = detailed_history_item.unwrap();

              let mut manager = app.clipboard_manager();

              if let (Some(true), Some(false)) = (
                detailed_history_item.is_image,
                detailed_history_item.is_link,
              ) {
                let image_path = match detailed_history_item.image_path_full_res {
                  Some(path) => path,
                  None => return (),
                };

                let img_data = std::fs::read(&image_path).expect("Failed to read image from path");
                let base64_image = base64::encode(&img_data);

                write_image_to_clipboard(base64_image).expect("Failed to write image to clipboard");
              } else {
                let value = match detailed_history_item.value {
                  Some(val) => val,
                  None => return (),
                };
                manager
                  .write_text(value)
                  .expect("failed to write to clipboard");
              }

              #[cfg(target_os = "windows")]
              {
                thread::sleep(StdDuration::from_secs(3));
              }

              #[cfg(target_os = "macos")]
              fn query_accessibility_permissions() -> bool {
                macos_accessibility_client::accessibility::application_is_trusted_with_prompt()
              }

              #[cfg(target_os = "windows")]
              fn query_accessibility_permissions() -> bool {
                return true;
              }

              #[cfg(any(target_os = "windows", target_os = "macos"))]
              if query_accessibility_permissions() {
                VKey.press_paste();
              } else {
                w.show().unwrap();
                w.emit("macosx-permissions-modal", "show").unwrap();
              }

              w.emit("execMenuItemById", item_id).unwrap();
            } else {
              debug_output(|| {
                println!("No item found with id: {:?}", item_id);
              });
            }
          }
        }
      },
      _ => {}
    })
    .on_window_event(|event| {
      let apply_offset = || {
        let _win = event.window();
        #[cfg(target_os = "macos")]
        if _win.label() == "main" {
          _win.position_traffic_lights(-10., -10.);
        }
      };

      match event.event() {
        tauri::WindowEvent::CloseRequested { api, .. } => {
          event.window().hide().unwrap();
          api.prevent_close();
        }
        tauri::WindowEvent::Focused(false) => {}
        tauri::WindowEvent::ThemeChanged(..) => apply_offset(),
        tauri::WindowEvent::Resized(..) => apply_offset(),
        _ => {}
      }
    })
    .setup(|app| {
      db::init(app);
      let app_settings = get_all_settings(None).unwrap_or_default();
      app.manage(app_settings);
      cron_jobs::setup_cron_jobs();

      // let handle = app.handle();
      // tauri::async_runtime::spawn(async move {
      //   match tauri::updater::builder(handle).check().await {
      //     Ok(update) => {
      //       if update.is_update_available() {
      //         update.download_and_install().await.unwrap();
      //       }
      //     }
      //     Err(e) => {
      //       println!("Error checking for update: {:?}", e);
      //     }
      //   }
      // });

      let menu = Menu::new().add_submenu(Submenu::new(
        "PasteBar",
        Menu::new()
          .add_native_item(MenuItem::CloseWindow)
          .add_native_item(MenuItem::Copy)
          .add_native_item(MenuItem::SelectAll)
          .add_native_item(MenuItem::Undo)
          .add_native_item(MenuItem::Redo)
          .add_native_item(MenuItem::Paste),
      ));

      let mut window_builder =
        tauri::WindowBuilder::new(app, "main", tauri::WindowUrl::App("index.html".into()))
          // .skip_taskbar(if cfg!(debug_assertions) { false } else { true })
          .inner_size(1100., 800.)
          .min_inner_size(750., 600.)
          // .decorations(false)
          // .title_bar_style(tauri::TitleBarStyle::Overlay)
          // .hidden_title(true)
          // transparent does use private APIs on Mac OS and is not recommended
          //.transparent(true)
          .disable_file_drop_handler()
          .menu(menu)
          .visible(false);

      #[cfg(target_os = "macos")]
      {
        window_builder = window_builder
          .title_bar_style(tauri::TitleBarStyle::Overlay)
          .hidden_title(true);
      }

      #[cfg(target_os = "windows")]
      {
        window_builder = window_builder.decorations(false).transparent(true);
      }

      let window = window_builder.build()?;

      // set dynamic title for window for Pro version
      window.set_title("PasteBar").unwrap();

      #[cfg(target_os = "windows")]
      {
        window.set_decorations(false).unwrap();
      }

      #[cfg(target_os = "macos")]
      {
        window.set_transparent_titlebar(true);
        window.position_traffic_lights(-10., -10.);
        window.set_decorations(true).unwrap();
      }

      {
        let last_save_time = std::cell::Cell::new(Instant::now() - StdDuration::from_secs(1));
        let app_handle = app.app_handle();
        let db_items_state_local = app.state();
        let db_recent_history_items_state = app.state();
        let app_settings = app.state();
        let tray_id = "app-tray";

        {
          let app_settings_local = app_handle.state::<Mutex<HashMap<String, Setting>>>();
          let settings_map = app_settings_local.lock().unwrap();
          if let Some(setting) = settings_map.get("userSelectedLanguage") {
            if let Some(value_text) = &setting.value_text {
              println!("Setting user language to: {}", value_text);
              Translations::set_user_language(&value_text);
            }
          }
        }

        match menu::build_tray_menu(
          db_items_state_local,
          db_recent_history_items_state,
          app_settings,
        ) {
          Ok(tray_menu) => {
            let menu = SystemTray::new().with_id(tray_id).with_menu(tray_menu);
            menu.build(app)?;
          }
          Err(error_msg) => {
            debug_output(|| {
              println!("Failed to build tray menu: {}", error_msg);
            });
          }
        }

        window.on_window_event(move |e| match e {
          tauri::WindowEvent::Moved(_) => {
            let now = Instant::now();
            if now - last_save_time.get() >= StdDuration::from_secs(3) {
              app_handle.save_window_state(StateFlags::all()).unwrap();
              last_save_time.set(now);
            }
          }
          tauri::WindowEvent::Resized(_) => {
            let now = Instant::now();
            if now - last_save_time.get() >= StdDuration::from_secs(3) {
              app_handle.save_window_state(StateFlags::all()).unwrap();
              last_save_time.set(now);
            }
          }
          _ => {}
        });
      }

      if cfg!(debug_assertions) {
        window.show().unwrap();
        #[cfg(debug_assertions)]
        {
          window.open_devtools();
        }
      } else {
        window.hide().unwrap();
      }

      let handle = app.handle().clone();
      let w = app.get_window("main").unwrap();

      let _ = tauri_plugin_deep_link::register("pastebar", move |request| {
        debug_output(|| {
          println!("scheme request received: {:?}", &request);
        });
        if request.starts_with("pastebar://") {
          w.show().unwrap();
          w.set_focus().unwrap();
          handle.emit_all("scheme-request-received", request).unwrap();
        }
      })
      .unwrap();

      #[cfg(not(target_os = "macos"))]
      // on macos the plugin handles this (macos doesn't use cli args for the url)
      if let Some(url) = std::env::args().nth(1) {
        debug_output(|| {
          println!("scheme request received on start url: {:?}", &url);
        });
        if url.starts_with("pastebar://") {
          let w = app.get_window("main").unwrap();
          w.show().unwrap();
          w.set_focus().unwrap();
          app
            .handle()
            .emit_all("scheme-request-received", url)
            .unwrap();
        }
      }

      std::thread::spawn(move || {});

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      app_ready,
      update_setting,
      tabs_commands::delete_tab,
      tabs_commands::create_tab,
      tabs_commands::update_tab,
      tabs_commands::update_tabs,
      items_commands::upload_image_file_to_item_id,
      items_commands::create_item,
      items_commands::duplicate_item,
      items_commands::duplicate_menu_item,
      items_commands::update_item_by_id,
      items_commands::update_items_by_ids,
      items_commands::update_menu_item_by_id,
      items_commands::update_menu_items_by_ids,
      items_commands::update_item_value_by_history_id,
      items_commands::delete_item_by_id,
      items_commands::delete_items_by_ids,
      items_commands::delete_image_by_item_by_id,
      items_commands::delete_menu_item_by_id,
      items_commands::delete_menu_items_by_ids,
      items_commands::update_pinned_items_by_ids,
      items_commands::unpin_all_items_clips,
      items_commands::move_pinned_clip_item_up_down,
      items_commands::add_image_to_item_id,
      items_commands::link_clip_to_menu_item,
      clipboard_commands::copy_text,
      clipboard_commands::copy_paste,
      clipboard_commands::copy_history_item,
      clipboard_commands::copy_paste_history_item,
      clipboard_commands::copy_paste_clip_item,
      clipboard_commands::copy_clip_item,
      clipboard_commands::run_form_fill,
      clipboard_commands::run_template_fill,
      link_metadata_commands::fetch_link_metadata,
      link_metadata_commands::delete_link_metadata,
      link_metadata_commands::get_link_metadata_by_item_id,
      link_metadata_commands::copy_link_metadata_to_new_item_id,
      collections_commands::get_collections,
      collections_commands::create_collection,
      collections_commands::get_collection,
      collections_commands::delete_collection_by_id,
      collections_commands::get_active_collection_with_menu_items,
      collections_commands::get_active_collection_with_clips,
      collections_commands::update_moved_menu_items_in_collection,
      collections_commands::update_collection_by_id,
      collections_commands::select_collection_by_id,
      collections_commands::update_moved_clips_in_collection,
      history_commands::get_clipboard_history,
      history_commands::get_clipboard_history_pinned,
      history_commands::get_clipboard_history_by_id,
      history_commands::delete_clipboard_history_by_ids,
      history_commands::find_clipboard_histories_by_value_or_filters,
      history_commands::get_recent_clipboard_histories,
      history_commands::get_clipboard_histories_within_date_range,
      history_commands::clear_clipboard_history_older_than,
      history_commands::count_clipboard_histories,
      history_commands::insert_clipboard_history,
      history_commands::update_clipboard_history_by_id,
      history_commands::update_clipboard_history_by_ids,
      history_commands::update_pinned_clipboard_history_by_ids,
      history_commands::unpin_all_clipboard_history_items,
      history_commands::move_pinned_item_up_down,
      history_commands::find_clipboard_history_by_id,
      history_commands::search_clipboard_histories_by_value_or_filters,
      history_commands::save_to_file_history_item,
      menu::build_system_menu,
      get_device_id,
      shell_commands::check_path,
      shell_commands::path_type_check,
      shell_commands::run_shell_command,
      request_commands::run_web_request,
      request_commands::run_web_scraping,
      translations_commands::update_translation_keys,
      translations_commands::change_menu_language,
      security_commands::hash_password,
      security_commands::verify_password,
      security_commands::store_os_password,
      security_commands::verify_os_password,
      security_commands::delete_os_password,
      security_commands::get_stored_os_password,
      open_osx_accessibility_preferences,
      check_osx_accessibility_preferences,
      open_path_or_app,
      autostart,
      is_autostart_enabled,
      set_icon
    ])
    .plugin(clipboard::init())
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
      debug_output(|| {
        println!("{}, {argv:?}, {cwd}", app.package_info().name);
      })
    }))
    .run(tauri::generate_context!())
    .expect("Error While Running PasteBar App");
}
