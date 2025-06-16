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
// use schema::clipboard_history::history_id;
use services::settings_service::insert_or_update_setting_by_name;
use services::utils;
use services::utils::debug_output;
use tokio::time::sleep;
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
use commands::backup_restore_commands;
use commands::clipboard_commands;
use commands::collections_commands;
use commands::download_update;
use commands::history_commands;
use commands::items_commands;
use commands::link_metadata_commands;
use commands::request_commands;
use commands::security_commands;
use commands::shell_commands;
use commands::tabs_commands;
use commands::translations_commands;
use commands::user_settings_command;

use db::AppConstants;
use mouse_position::mouse_position::Mouse;
use std::collections::HashMap;

use serde::Serialize;
use tauri::ClipboardManager;
use tauri::Manager;
use tauri::SystemTray;
use tauri::SystemTrayEvent;
use tauri::SystemTrayMenu; // Added for empty menu
// use tauri_plugin_positioner::{Position, WindowExt};
use crate::services::user_settings_service;

use fns::debounce;
use inputbot::KeybdKey::*;
use once_cell::sync::Lazy;
use std::ptr;
use std::sync::Arc;
use std::sync::Mutex;
use std::time::Duration as StdDuration;
use std::time::Instant;
use tokio::sync::Mutex as TokioMutex;
use window_state::AppHandleExt;
use window_state::StateFlags;

#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

#[cfg(target_os = "macos")]
use cocoa::{appkit::NSApplication, base::nil};

#[cfg(target_os = "macos")]
fn return_focus_to_previous_window() {
  unsafe {
    let app = NSApplication::sharedApplication(nil);
    let _: () = msg_send![app, hide: nil];
  }
}

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
async fn quickpaste_hide_paste_close(
  app_handle: tauri::AppHandle,
  history_id: String,
) -> Result<(), String> {
  // Get the quickpaste window
  let window = app_handle
    .get_window("quickpaste")
    .ok_or_else(|| "Failed to get quickpaste window".to_string())?;

  // Hide the window
  window
    .hide()
    .map_err(|e| format!("Failed to hide window: {}", e))?;

  // Return focus to the previous window
  #[cfg(target_os = "macos")]
  return_focus_to_previous_window();

  sleep(StdDuration::from_millis(200)).await;

  // Copy and paste the history item
  clipboard_commands::copy_paste_history_item(app_handle.clone(), history_id, 0);

  // Close the window
  window
    .close()
    .map_err(|e| format!("Failed to close window: {}", e))?;

  Ok(())
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

  let app_settings = app_handle.state::<Mutex<HashMap<String, Setting>>>();

  let hide_main_window_on_startup = app_settings
    .lock()
    .unwrap()
    .get("isKeepMainWindowClosedOnRestartEnabled")
    .map(|setting| setting.value_bool.unwrap_or(false))
    .unwrap_or(false);

  if !hide_main_window_on_startup {
    window.show().unwrap();
  }

  debug_output(|| {
    println!("app_ready on client");
  });

  let constants = db::APP_CONSTANTS
    .get()
    .ok_or("APP_CONSTANTS not initialized")?;

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
fn get_app_settings(app_handle: tauri::AppHandle) -> Result<String, String> {
  println!("app_settings on client");
  let app_settings = app_handle.state::<Mutex<HashMap<String, Setting>>>();

  let constants = db::APP_CONSTANTS
    .get()
    .ok_or("APP_CONSTANTS not initialized")?;

  let response = AppReadyResponse {
    constants: constants,
    permissionstrusted: true,
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
    macos_accessibility_client::accessibility::application_is_trusted()
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
          tauri::Icon::Raw(include_bytes!("../icons/tray128x128-color.png").to_vec())
        } else {
          tauri::Icon::Raw(include_bytes!("../icons/tray128x128-color.png").to_vec())
        }
      } else {
        tauri::Icon::Raw(include_bytes!("../icons/tray128x128.png").to_vec())
      })
      .unwrap(),
  }
}

#[cfg(target_os = "macos")]
#[tauri::command]
fn open_history_window(app_handle: tauri::AppHandle) -> Result<(), String> {
  // check if the window is already open
  if app_handle.get_window("history").is_some() {
    // show if exist and return
    let window = app_handle
      .get_window("history")
      .ok_or_else(|| "Failed to get history window".to_string())?;
    // bring to front
    window.show().map_err(|e| e.to_string())?;
    // window.set_focus().map_err(|e| e.to_string())?;

    return Ok(());
  }
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

  let mut window_builder = tauri::WindowBuilder::new(
    &app_handle,
    "history",
    tauri::WindowUrl::App("history-index".into()),
  )
  .title("PasteBar History")
  .max_inner_size(700.0, 2200.0)
  .min_inner_size(300.0, 400.0)
  .menu(menu)
  .visible(false);

  window_builder = window_builder
    .title_bar_style(tauri::TitleBarStyle::Overlay)
    .hidden_title(true);

  let history_window = window_builder.build().map_err(|e| e.to_string())?;

  history_window.set_transparent_titlebar(true);
  history_window.position_traffic_lights(-10., -10.);

  {
    let app_handle_clone = app_handle.clone();

    let debounced_save = debounce(
      move |_: ()| {
        app_handle_clone
          .save_window_state(StateFlags::POSITION | StateFlags::SIZE)
          .unwrap_or_else(|e| eprintln!("Failed to save window state: {}", e));
      },
      StdDuration::from_secs(1),
    );

    history_window.on_window_event(move |e| match e {
      tauri::WindowEvent::Destroyed => {
        app_handle.save_window_state(StateFlags::all()).unwrap();
        app_handle
          .emit_all("window-events", "history-window-closed")
          .unwrap_or_else(|e| eprintln!("Failed to emit window closed event: {}", e));
      }
      tauri::WindowEvent::Moved(_) | tauri::WindowEvent::Resized(_) => {
        debounced_save.call(());
      }
      _ => {}
    });
  }

  // history_window.hide().map_err(|e| e.to_string())?;
  history_window.show().map_err(|e| e.to_string())?;
  history_window.set_focus().map_err(|e| e.to_string())?;

  Ok(())
}

// On Windows, the open new window command must be async
#[cfg(target_os = "windows")]
#[tauri::command]
async fn open_history_window(app_handle: tauri::AppHandle) -> Result<(), String> {
  // check if the window is already open
  if app_handle.get_window("history").is_some() {
    // show if exist and return
    let window = app_handle
      .get_window("history")
      .ok_or_else(|| "Failed to get history window".to_string())?;
    // bring to front
    window.show().map_err(|e| e.to_string())?;
    // window.set_focus().map_err(|e| e.to_string())?;

    return Ok(());
  }
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

  let mut window_builder = tauri::WindowBuilder::new(
    &app_handle,
    "history",
    tauri::WindowUrl::App("history-index".into()),
  )
  .title("PasteBar History")
  .decorations(false)
  .transparent(true)
  .max_inner_size(700.0, 2200.0)
  .min_inner_size(300.0, 400.0)
  .menu(menu)
  .visible(false);

  window_builder = window_builder.decorations(false).transparent(true);

  let history_window = window_builder.build().map_err(|e| e.to_string())?;

  {
    let app_handle_clone = app_handle.clone();

    let debounced_save = debounce(
      move |_: ()| {
        app_handle_clone
          .save_window_state(StateFlags::POSITION | StateFlags::SIZE)
          .unwrap_or_else(|e| eprintln!("Failed to save window state: {}", e));
      },
      StdDuration::from_secs(1),
    );

    history_window.on_window_event(move |e| match e {
      tauri::WindowEvent::Destroyed => {
        app_handle.save_window_state(StateFlags::all()).unwrap();
        app_handle
          .emit_all("window-events", "history-window-closed")
          .unwrap_or_else(|e| eprintln!("Failed to emit window closed event: {}", e));
      }
      tauri::WindowEvent::Moved(_) | tauri::WindowEvent::Resized(_) => {
        debounced_save.call(());
      }
      _ => {}
    });
  }

  let _ = history_window.set_decorations(false);
  history_window.show().map_err(|e| e.to_string())?;
  history_window.set_focus().map_err(|e| e.to_string())?;

  Ok(())
}

#[tauri::command]
async fn open_quickpaste_window(app_handle: tauri::AppHandle, title: String) -> Result<(), String> {
  if let Some(window) = app_handle.get_window("quickpaste") {
    window.close().map_err(|e| e.to_string())?;
    return Ok(());
  }

  let window_width = 310.0;
  let window_height = 420.0;

  let main_window = app_handle.get_window("main").unwrap();
  let is_main_window_visible = main_window.is_visible().unwrap();

  if is_main_window_visible {
    #[cfg(target_os = "macos")]
    main_window.hide().map_err(|e| e.to_string())?;
  }

  let window_builder = tauri::WindowBuilder::new(
    &app_handle,
    "quickpaste",
    tauri::WindowUrl::App("quickpaste-index".into()),
  )
  .title(title)
  .always_on_top(true)
  .maximizable(false)
  .resizable(true)
  .max_inner_size(500.0, 800.0)
  .min_inner_size(window_width, window_height)
  .minimizable(false)
  .inner_size(window_width, window_height)
  .visible(false);

  let quickpaste_window = window_builder.build().map_err(|e| e.to_string())?;

  let position = Mouse::get_mouse_position();

  let (cursor_x, cursor_y) = match position {
    Mouse::Position { x, y } => (x, y),
    Mouse::Error => {
      println!("Failed to get mouse position, using default (100, 100)");
      (100, 100)
    }
  };

  // Get all monitors
  let monitors = quickpaste_window
    .available_monitors()
    .map_err(|e| e.to_string())?;

  // Calculate global screen size
  let mut global_width = 0;
  let mut global_height = 0;
  let mut scale_factor = 1.0;

  for monitor in &monitors {
    scale_factor = monitor.scale_factor(); // Use the scale factor of the primary monitor
    println!("Monitor scale factor: {}", scale_factor);
    let monitor_size = monitor.size();

    println!(
      "Monitor size: {}x{}",
      monitor_size.width, monitor_size.height
    );

    let actual_width = (monitor_size.width as f64 / scale_factor).round() as i32;
    let actual_height = (monitor_size.height as f64 / scale_factor).round() as i32;

    global_width += actual_width;
    global_height = global_height.max(actual_height);
  }

  #[cfg(target_os = "macos")]
  let cursor_x_scale = (cursor_x as f64).round() as i32;
  #[cfg(target_os = "macos")]
  let cursor_y_scale = (cursor_y as f64).round() as i32;

  #[cfg(target_os = "windows")]
  let cursor_x_scale = (cursor_x as f64 / scale_factor).round() as i32;
  #[cfg(target_os = "windows")]
  let cursor_y_scale = (cursor_y as f64 / scale_factor).round() as i32;

  // Calculate the window position in logical coordinates
  let window_x = if cursor_x_scale + window_width as i32 + 50 > global_width {
    cursor_x_scale - window_width as i32 - 50 // Place to the left if not enough space on the right
  } else {
    cursor_x_scale + 50
  };

  let window_y = if cursor_y_scale + window_height as i32 > global_height {
    cursor_y_scale - window_height as i32 - 50
  } else {
    cursor_y_scale - 50
  };

  quickpaste_window
    .set_position(tauri::LogicalPosition {
      x: window_x,
      y: window_y,
    })
    .map_err(|e| e.to_string())?;

  {
    let app_handle_clone = app_handle.clone();

    quickpaste_window.on_window_event(move |e| match e {
      tauri::WindowEvent::Destroyed => {
        #[cfg(target_os = "macos")]
        {
          return_focus_to_previous_window();
          if is_main_window_visible {
            let _ = app_handle_clone
              .get_window("main")
              .unwrap()
              .show()
              .map_err(|e| e.to_string());
          }
        }

        app_handle_clone
          .emit_all("window-events", "quickpaste-window-closed")
          .unwrap_or_else(|e| eprintln!("Failed to emit window closed event: {}", e));
      }
      tauri::WindowEvent::CloseRequested { api, .. } => {
        api.prevent_close();
        if let Some(window) = app_handle_clone.get_window("quickpaste") {
          let _ = window
            .close()
            .map_err(|e| eprintln!("Failed to close window: {}", e));
        }
        #[cfg(target_os = "macos")]
        return_focus_to_previous_window();
      }
      _ => {}
    });
  }

  quickpaste_window.show().map_err(|e| e.to_string())?;
  quickpaste_window.set_focus().map_err(|e| e.to_string())?;

  // println!(
  //   "User cursor position: {}x{}",
  //   cursor_x_scale, cursor_y_scale
  // );
  // println!("Global window size: {}x{}", global_width, global_height);
  // println!("Window position: {}x{}", window_x, window_y);

  Ok(())
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
          w.emit_all("window-events", "main-window-show").unwrap();
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

          // Get the copy-only setting
          let app_settings = app.state::<Mutex<HashMap<String, Setting>>>();
          let settings_map = app_settings.lock().unwrap();
          let is_copy_only = settings_map
            .get("isMenuItemCopyOnlyEnabled")
            .and_then(|setting| setting.value_bool)
            .unwrap_or(false);

          debug_output(|| {
            println!("Looking for item with item_id: {:?}", item_id);
            println!("is_copy_only: {:?}", is_copy_only);
          });

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

                // Convert relative path to absolute path
                let absolute_path = db::to_absolute_image_path(&image_path);
                let img_data =
                  std::fs::read(&absolute_path).expect("Failed to read image from path");
                let base64_image = base64::encode(&img_data);

                write_image_to_clipboard(base64_image).expect("Failed to write image to clipboard");
              }
              if item.is_link.unwrap_or(false) {
                let url = item.value.as_deref().unwrap_or("");
                if is_copy_only {
                  // Copy URL to clipboard instead of opening it
                  debug_output(|| {
                    println!("Copying URL to clipboard: {}", url);
                  });
                  manager
                    .write_text(url)
                    .expect("failed to write to clipboard");
                } else {
                  let _ = opener::open(ensure_url_or_email_prefix(url))
                    .map_err(|e| format!("Failed to open url: {}", e));
                }
              } else if item.is_path.unwrap_or(false) {
                let path = item.value.as_deref().unwrap_or("");
                if is_copy_only {
                  // Copy path to clipboard instead of opening it
                  debug_output(|| {
                    println!("Copying path to clipboard: {}", path);
                  });
                  manager
                    .write_text(path)
                    .expect("failed to write to clipboard");
                } else {
                  let _ = opener::open(path).map_err(|e| format!("Failed to open path: {}", e));
                }
              } else {
                if item.value.as_deref().unwrap_or("").is_empty() {
                  debug_output(|| {
                    println!("Copying item name to clipboard: {}", &item.name);
                  });
                  manager
                    .write_text(&item.name)
                    .expect("failed to write to clipboard");
                } else if let Some(ref item_value) = item.value {
                  let text_to_copy = remove_special_bbcode_tags(item_value);
                  debug_output(|| {
                    println!("Copying item value to clipboard: {}", text_to_copy);
                  });
                  manager
                    .write_text(text_to_copy)
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

              // Only auto-paste if not in copy-only mode
              if !is_copy_only {
                #[cfg(any(target_os = "windows", target_os = "macos"))]
                if query_accessibility_permissions() {
                  VKey.press_paste();
                } else {
                  w.show().unwrap();
                  w.emit("macosx-permissions-modal", "show").unwrap();
                }
              }

              w.emit("execMenuItemById", item_id).unwrap();
            } else {
              let app_clone = app.clone();
              let item_id_string = item_id.to_string();

              thread::spawn(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();

                let delay = if cfg!(target_os = "windows") { 3 } else { 0 };

                rt.block_on(async {
                  if is_copy_only {
                    // For copy-only mode, use copy function instead of copy-paste
                    clipboard_commands::copy_clip_item(app_clone, item_id_string, true).await;
                  } else {
                    copy_paste_clip_item_from_menu(app_clone, item_id_string, delay).await;
                  }
                });
              });
            }
          } else {
            debug_output(|| {
              println!(
                "Item not found in db_items_state, checking recent history for: {:?}",
                item_id
              );
            });

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

                // Convert relative path to absolute path
                let absolute_path = db::to_absolute_image_path(&image_path);
                let img_data =
                  std::fs::read(&absolute_path).expect("Failed to read image from path");
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

              // Only auto-paste if not in copy-only mode
              if !is_copy_only {
                #[cfg(any(target_os = "windows", target_os = "macos"))]
                if query_accessibility_permissions() {
                  VKey.press_paste();
                } else {
                  w.show().unwrap();
                  w.emit("macosx-permissions-modal", "show").unwrap();
                }
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
        #[cfg(target_os = "macos")]
        if _win.label() == "history" {
          _win.position_traffic_lights(-10., -10.);
        }
      };

      match event.event() {
        tauri::WindowEvent::CloseRequested { api, .. } => {
          let _win = event.window();
          if _win.label() != "history" {
            _win.emit_all("window-events", "main-window-hide").unwrap();

            event.window().hide().unwrap();
            api.prevent_close();
          }
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
      cron_jobs::setup_cron_jobs();

      #[cfg(target_os = "macos")]
      {
        let settings_map = app_settings.lock().unwrap();
        if let Some(setting) = settings_map.get("isHideMacOSDockIcon") {
          if let Some(value_bool) = &setting.value_bool {
            if *value_bool {
              app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }
          }
        }
      }

      let mut window_min_inner_width = 720.;

      // if settings isHistoryPanelVisibleOnly is true set min inner size to 310 width
      {
        let settings_map = app_settings.lock().unwrap();
        if let Some(setting) = settings_map.get("isHistoryPanelVisibleOnly") {
          if let Some(value_bool) = &setting.value_bool {
            if *value_bool {
              window_min_inner_width = 310.;
            }
          }
        }
      }

      app.manage(app_settings);

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
          .inner_size(1100., 730.)
          .min_inner_size(window_min_inner_width, 620.)
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
              Translations::set_user_language(&value_text);
            }
          }
        }

        // Determine if the tray icon should be shown
        let show_tray_icon_setting = user_settings_service::get_setting("showTrayIcon");
        let mut show_tray_icon_bool = true; // Default to true if not found or not a bool
        if let Some(value) = show_tray_icon_setting {
          if let serde_yaml::Value::Bool(b) = value {
            show_tray_icon_bool = b;
          }
        }

        if show_tray_icon_bool {
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
        }

        {
          let app_handle_clone = app_handle.clone();

          let debounced_save_position = debounce(
            move |_: ()| {
              println!("Saving window state main window");
              app_handle_clone
                .save_window_state(StateFlags::POSITION)
                .unwrap_or_else(|e| eprintln!("Failed to save window position: {}", e));
            },
            StdDuration::from_secs(1),
          );

          let debounced_save_size = debounce(
            move |_: ()| {
              app_handle
                .save_window_state(StateFlags::SIZE)
                .unwrap_or_else(|e| eprintln!("Failed to save window size: {}", e));
            },
            StdDuration::from_secs(1),
          );

          window.on_window_event(move |e| match e {
            tauri::WindowEvent::Moved(_) => {
              debounced_save_position.call(());
            }
            tauri::WindowEvent::Resized(_) => {
              debounced_save_size.call(());
            }
            _ => {}
          });
        }
      }

      if cfg!(debug_assertions) {
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
      get_app_settings,
      update_setting,
      backup_restore_commands::create_backup,
      backup_restore_commands::list_backups,
      backup_restore_commands::restore_backup,
      backup_restore_commands::delete_backup,
      backup_restore_commands::get_data_paths,
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
      items_commands::save_to_file_clip_item,
      clipboard_commands::copy_text,
      clipboard_commands::copy_paste,
      clipboard_commands::copy_history_item,
      clipboard_commands::copy_paste_history_item,
      clipboard_commands::copy_paste_clip_item,
      clipboard_commands::copy_clip_item,
      clipboard_commands::run_form_fill,
      clipboard_commands::run_template_fill,
      link_metadata_commands::fetch_link_metadata,
      link_metadata_commands::fetch_path_metadata,
      link_metadata_commands::fetch_link_track_metadata,
      link_metadata_commands::validate_audio,
      link_metadata_commands::delete_link_metadata,
      link_metadata_commands::get_link_metadata_by_item_id,
      link_metadata_commands::copy_link_metadata_to_new_item_id,
      link_metadata_commands::download_audio,
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
      download_update::download_and_execute,
      history_commands::get_clipboard_history,
      history_commands::get_clipboard_history_pinned,
      history_commands::get_clipboard_history_by_id,
      history_commands::delete_clipboard_history_by_ids,
      history_commands::find_clipboard_histories_by_value_or_filters,
      history_commands::get_recent_clipboard_histories,
      history_commands::get_clipboard_histories_within_date_range,
      history_commands::clear_clipboard_history_older_than,
      history_commands::clear_recent_clipboard_history,
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
      history_commands::get_history_items_source_apps,
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
      user_settings_command::cmd_get_custom_db_path,
      // user_settings_command::cmd_set_custom_db_path, // Replaced by cmd_set_and_relocate_db
      // user_settings_command::cmd_remove_custom_db_path, // Replaced by cmd_revert_to_default_db_location
      user_settings_command::cmd_create_directory,
      user_settings_command::cmd_validate_custom_db_path,
      user_settings_command::cmd_check_custom_data_path,
      user_settings_command::cmd_set_and_relocate_data,
      user_settings_command::cmd_revert_to_default_data_location,
      user_settings_command::cmd_get_all_settings,
      user_settings_command::cmd_get_setting,
      user_settings_command::cmd_set_setting,
      user_settings_command::cmd_remove_setting,
      open_osx_accessibility_preferences,
      check_osx_accessibility_preferences,
      open_path_or_app,
      autostart,
      is_autostart_enabled,
      open_history_window,
      open_quickpaste_window,
      quickpaste_hide_paste_close,
      set_icon
    ])
    .plugin(clipboard::init())
    .plugin(window_state::Builder::default().build())
    .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
      debug_output(|| {
        println!("{}, {argv:?}, {cwd}", app.package_info().name);
      })
    }))
    .run(tauri::generate_context!())
    .expect("Error While Running PasteBar App");
}
