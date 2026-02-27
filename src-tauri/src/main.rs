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
mod sync;

use crate::commands::clipboard_commands::copy_paste_clip_item_from_menu;
use crate::commands::clipboard_commands::write_image_to_clipboard;
use crate::menu::DbItems;
use crate::models::Setting;
use crate::services::history_service;
use crate::services::settings_service::get_all_settings;
use crate::services::translations::translations::Translations;
use crate::services::utils::remove_special_bbcode_tags;
use crate::services::utils::{apply_global_templates, ensure_url_or_email_prefix};
use commands::backup_restore_commands;
use commands::clipboard_commands;
use commands::collections_commands;
use commands::download_update;
use commands::format_converter_commands;
use commands::history_commands;
use commands::items_commands;
use commands::link_metadata_commands;
use commands::request_commands;
use commands::security_commands;
use commands::shell_commands;
use commands::sync_commands;
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
// use tauri_plugin_positioner::{Position, WindowExt};

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

#[cfg(target_os = "windows")]
#[tauri::command]
fn update_left_click_tray_env(is_toggle_enabled: bool, is_disabled: bool) -> Result<(), String> {
  let should_disable_context_menu = is_disabled || is_toggle_enabled;

  std::env::set_var(
    "PASTEBAR_ENABLE_LEFT_CLICK_MENU",
    should_disable_context_menu.to_string(),
  );
  Ok(())
}

#[cfg(target_os = "macos")]
#[tauri::command]
fn update_left_click_tray_env(is_toggle_enabled: bool, is_disabled: bool) -> Result<(), String> {
  Ok(())
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
                  // Apply global templates
                  let final_text = apply_global_templates(url, &settings_map);
                  debug_output(|| {
                    println!("Copying URL to clipboard: {}", final_text);
                  });
                  manager
                    .write_text(final_text)
                    .expect("failed to write to clipboard");
                } else {
                  let _ = opener::open(ensure_url_or_email_prefix(url))
                    .map_err(|e| format!("Failed to open url: {}", e));
                }
              } else if item.is_path.unwrap_or(false) {
                let path = item.value.as_deref().unwrap_or("");
                if is_copy_only {
                  // Copy path to clipboard instead of opening it
                  // Apply global templates
                  let final_text = apply_global_templates(path, &settings_map);
                  debug_output(|| {
                    println!("Copying path to clipboard: {}", final_text);
                  });
                  manager
                    .write_text(final_text)
                    .expect("failed to write to clipboard");
                } else {
                  let _ = opener::open(path).map_err(|e| format!("Failed to open path: {}", e));
                }
              } else {
                if item.value.as_deref().unwrap_or("").is_empty() {
                  // Apply global templates to item name
                  let final_text = apply_global_templates(&item.name, &settings_map);
                  debug_output(|| {
                    println!("Copying item name to clipboard: {}", final_text);
                  });
                  manager
                    .write_text(final_text)
                    .expect("failed to write to clipboard");
                } else if let Some(ref item_value) = item.value {
                  let text_to_copy = remove_special_bbcode_tags(item_value);
                  // Apply global templates
                  let final_text = apply_global_templates(&text_to_copy, &settings_map);
                  debug_output(|| {
                    println!("Copying item value to clipboard: {}", final_text);
                  });
                  manager
                    .write_text(final_text)
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
                // Apply global templates
                let final_text = apply_global_templates(&value, &settings_map);
                manager
                  .write_text(final_text)
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
      #[cfg(target_os = "windows")]
      SystemTrayEvent::LeftClick { .. } => {
        let app_settings = app.state::<Mutex<HashMap<String, Setting>>>();
        let settings_map = app_settings.lock().unwrap();
        let enable_left_click = settings_map
          .get("isLeftClickTrayToOpenEnabledOnWindows")
          .and_then(|setting| setting.value_bool)
          .unwrap_or(false);

        if enable_left_click {
          let window = app.get_window("main").unwrap();
          if window.is_visible().unwrap() {
            window.hide().unwrap();
            window
              .emit_all("window-events", "main-window-hide")
              .unwrap();
          } else {
            window.show().unwrap();
            window.unminimize().unwrap();
            window.set_focus().unwrap();
            window
              .emit_all("window-events", "main-window-show")
              .unwrap();
          }
        }
      }
      #[cfg(target_os = "windows")]
      SystemTrayEvent::DoubleClick { .. } => {
        let app_settings = app.state::<Mutex<HashMap<String, Setting>>>();
        let settings_map = app_settings.lock().unwrap();
        let is_enabled = settings_map
          .get("isDoubleClickTrayToOpenEnabledOnWindows")
          .and_then(|setting| setting.value_bool)
          .unwrap_or(true);

        if is_enabled {
          let window = app.get_window("main").unwrap();
          if window.is_visible().unwrap() {
            window.hide().unwrap();
            window
              .emit_all("window-events", "main-window-hide")
              .unwrap();
          } else {
            window.show().unwrap();
            window.unminimize().unwrap();
            window.set_focus().unwrap();
            window
              .emit_all("window-events", "main-window-show")
              .unwrap();
          }
        }
      }
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

        match menu::build_tray_menu(
          db_items_state_local,
          db_recent_history_items_state,
          app_settings,
        ) {
          Ok(tray_menu) => {
            #[cfg(target_os = "windows")]
            {
              let app_settings_for_tray = app_handle.state::<Mutex<HashMap<String, Setting>>>();
              let settings_map = app_settings_for_tray.lock().unwrap();

              // Check both settings to determine the environment variable value
              let is_disabled = settings_map
                .get("isLeftClickTrayDisabledOnWindows")
                .and_then(|setting| setting.value_bool)
                .unwrap_or(false);

              let is_toggle_enabled = settings_map
                .get("isLeftClickTrayToOpenEnabledOnWindows")
                .and_then(|setting| setting.value_bool)
                .unwrap_or(false);

              let should_disable_context_menu = is_disabled || is_toggle_enabled;

              std::env::set_var(
                "PASTEBAR_ENABLE_LEFT_CLICK_MENU",
                should_disable_context_menu.to_string(),
              );
            }

            let menu = SystemTray::new().with_id(tray_id).with_menu(tray_menu);
            menu.build(app)?;
          }
          Err(error_msg) => {
            debug_output(|| {
              println!("Failed to build tray menu: {}", error_msg);
            });
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
      update_left_click_tray_env,
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
      sync_commands::sync_get_ui_status,
      sync_commands::sync_set_mode,
      sync_commands::sync_retry,
      sync_commands::sync_disconnect,
      sync_commands::sync_generate_pair_code,
      sync_commands::sync_cancel_pair_code,
      sync_commands::sync_join_with_code,
      sync_commands::sync_scan_network_devices,
      sync_commands::sync_history_now,
      sync_commands::sync_list_peers,
      sync_commands::sync_remove_peer,
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
      format_converter_commands::format_convert,
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


#[cfg(test)]
mod sync_plan_tests {
  use diesel::r2d2::CustomizeConnection;
  use diesel::prelude::*;
  use diesel::sql_types::{BigInt, Integer, Nullable, Text};
  use diesel::QueryableByName;
  use diesel_migrations::{FileBasedMigrations, MigrationHarness};

  #[derive(QueryableByName)]
  struct NameRow {
    #[diesel(sql_type = Text)]
    name: String,
  }

  #[derive(QueryableByName)]
  struct HlcRow {
    #[diesel(sql_type = BigInt)]
    wall_ms: i64,
    #[diesel(sql_type = Integer)]
    counter: i32,
  }

  #[derive(QueryableByName)]
  struct JournalModeRow {
    #[diesel(sql_type = Text)]
    journal_mode: String,
  }

  #[derive(QueryableByName)]
  struct CountRow {
    #[diesel(sql_type = BigInt)]
    total: i64,
  }

  #[derive(QueryableByName)]
  struct IdRow {
    #[diesel(sql_type = Integer)]
    id: i32,
  }

  #[derive(QueryableByName)]
  struct SeqRow {
    #[diesel(sql_type = BigInt)]
    seq: i64,
  }

  #[derive(QueryableByName)]
  struct SyncChangeRow {
    #[diesel(sql_type = Text)]
    table_name: String,
    #[diesel(sql_type = Text)]
    row_id: String,
    #[diesel(sql_type = Nullable<Text>)]
    row_json: Option<String>,
  }

  #[derive(QueryableByName)]
  struct CursorRow {
    #[diesel(sql_type = BigInt)]
    last_applied_seq: i64,
  }

  #[derive(QueryableByName)]
  struct HistoryValueRow {
    #[diesel(sql_type = Nullable<Text>)]
    value: Option<String>,
    #[diesel(sql_type = BigInt)]
    updated_at: i64,
  }

  fn sync_changes_count(connection: &mut diesel::sqlite::SqliteConnection) -> i64 {
    let rows: Vec<CountRow> = diesel::sql_query("SELECT COUNT(*) AS total FROM sync_changes")
      .load(connection)
      .expect("Failed to count sync_changes rows");
    rows[0].total
  }

  fn insert_minimal_history_row(
    connection: &mut diesel::sqlite::SqliteConnection,
    history_id_value: &str,
    updated_at_value: i64,
  ) {
    diesel::sql_query(
      "INSERT INTO clipboard_history (
         history_id,
         title,
         value,
         is_text,
         created_at,
         updated_at,
         created_date,
         updated_date
       ) VALUES (
         ?, 'HistoryTitle', 'HistoryValue', 1, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       )",
    )
    .bind::<Text, _>(history_id_value.to_string())
    .bind::<BigInt, _>(updated_at_value)
    .bind::<BigInt, _>(updated_at_value)
    .execute(connection)
    .expect("Failed to insert clipboard_history row");
  }

  fn sync_pending_count(connection: &mut diesel::sqlite::SqliteConnection) -> i64 {
    let rows: Vec<CountRow> = diesel::sql_query("SELECT COUNT(*) AS total FROM sync_pending_apply")
      .load(connection)
      .expect("Failed to count sync_pending_apply rows");
    rows[0].total
  }

  fn sync_dead_letter_count(connection: &mut diesel::sqlite::SqliteConnection) -> i64 {
    let rows: Vec<CountRow> = diesel::sql_query("SELECT COUNT(*) AS total FROM sync_dead_letter")
      .load(connection)
      .expect("Failed to count sync_dead_letter rows");
    rows[0].total
  }

  #[test]
  fn default_sync_mode_is_off() {
    let cfg = crate::sync::config::SyncConfig::default();
    assert_eq!(cfg.mode, crate::sync::types::SyncMode::Off);
  }

  #[test]
  fn sync_mode_default_off_regression_guard() {
    assert_eq!(
      crate::sync::config::SyncConfig::default().mode,
      crate::sync::types::SyncMode::Off
    );
  }

  #[test]
  fn sync_core_tables_exist_after_migration() {
    let mut connection = diesel::sqlite::SqliteConnection::establish(":memory:")
      .expect("Failed to create in-memory sqlite connection");
    let migrations = FileBasedMigrations::find_migrations_directory()
      .expect("Failed to find migrations directory");
    connection
      .run_pending_migrations(migrations)
      .expect("Failed to run migrations");

    let rows: Vec<NameRow> = diesel::sql_query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sync_meta','sync_changes','sync_peer_cursor','sync_pending_apply','sync_dead_letter','sync_gc_state','sync_conflict_log','sync_blob_refs')",
    )
    .load(&mut connection)
    .expect("Failed to query sqlite_master");

    assert_eq!(rows.len(), 8, "Expected all 8 sync core tables");
  }

  #[test]
  fn sqlite_hlc_functions_are_available() {
    let mut connection = diesel::sqlite::SqliteConnection::establish(":memory:")
      .expect("Failed to create in-memory sqlite connection");
    let options = crate::db::ConnectionOptions {
      enable_wal: false,
      enable_foreign_keys: false,
      busy_timeout: None,
    };
    options
      .on_acquire(&mut connection)
      .expect("Failed to configure sqlite connection");

    let rows: Vec<HlcRow> =
      diesel::sql_query("SELECT get_hlc_wall_ms() AS wall_ms, get_hlc_counter() AS counter")
        .load(&mut connection)
        .expect("HLC SQL functions should be available");

    assert_eq!(rows.len(), 1);
    assert!(rows[0].wall_ms > 0);
    assert!(rows[0].counter > 0);
  }

  #[test]
  fn sqlite_journal_mode_is_wal() {
    let temp_db = tempfile::NamedTempFile::new().expect("Failed to create temp db file");
    let db_path = temp_db.path().to_string_lossy().to_string();
    let mut connection = diesel::sqlite::SqliteConnection::establish(&db_path)
      .expect("Failed to create sqlite connection");
    let options = crate::db::runtime_connection_options();
    options
      .on_acquire(&mut connection)
      .expect("Failed to configure sqlite connection");

    let rows: Vec<JournalModeRow> = diesel::sql_query("PRAGMA journal_mode;")
      .load(&mut connection)
      .expect("Failed to read sqlite journal mode");

    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].journal_mode.to_lowercase(), "wal");
  }

  #[test]
  fn remote_apply_context_does_not_emit_outbox_event() {
    let mut connection = diesel::sqlite::SqliteConnection::establish(":memory:")
      .expect("Failed to create in-memory sqlite connection");
    let options = crate::db::runtime_connection_options();
    options
      .on_acquire(&mut connection)
      .expect("Failed to configure sqlite connection");

    let migrations = FileBasedMigrations::find_migrations_directory()
      .expect("Failed to find migrations directory");
    connection
      .run_pending_migrations(migrations)
      .expect("Failed to run migrations");

    diesel::sql_query(
      "INSERT INTO items (
        item_id, name, is_active, is_disabled, is_deleted, is_folder, is_separator, is_board, is_menu, is_clip,
        layout_split, created_at, updated_at, created_date, updated_date
      ) VALUES (
        'sync-trigger-test-item-001', 'Initial', 1, 0, 0, 0, 0, 0, 0, 1,
        50, 1000, 1000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )",
    )
    .execute(&mut connection)
    .expect("Failed to insert test item");

    let before = sync_changes_count(&mut connection);

    {
      let mut remote_apply_guard =
        crate::sync::apply_context::enable_remote_apply_context(&mut connection)
          .expect("Failed to enable remote apply context");
      diesel::sql_query(
        "UPDATE items
         SET name = 'RemoteApply', updated_at = updated_at + 1
         WHERE item_id = 'sync-trigger-test-item-001'",
      )
      .execute(remote_apply_guard.conn_mut())
      .expect("Failed to update item during remote apply context");
    }

    let after_remote_apply = sync_changes_count(&mut connection);
    assert_eq!(after_remote_apply, before);

    diesel::sql_query(
      "UPDATE items
       SET name = 'LocalApply', updated_at = updated_at + 1
       WHERE item_id = 'sync-trigger-test-item-001'",
    )
    .execute(&mut connection)
    .expect("Failed to update item without remote apply context");

    let after_local_apply = sync_changes_count(&mut connection);
    assert_eq!(after_local_apply, after_remote_apply + 1);
  }

  #[test]
  fn switching_to_off_stops_sync_runtime() {
    let engine = crate::sync::engine::SyncEngine::default();

    engine
      .set_mode(crate::sync::types::SyncMode::On)
      .expect("Failed to switch sync mode to On");
    engine
      .set_mode(crate::sync::types::SyncMode::Off)
      .expect("Failed to switch sync mode to Off");

    let snapshot = engine.snapshot();
    assert_eq!(snapshot.mode, crate::sync::types::SyncMode::Off);
    assert!(!snapshot.discovery_running);
    assert!(!snapshot.session_running);
    assert!(!snapshot.schedulers_running);
  }

  #[test]
  fn request_below_pruned_seq_returns_cursor_pruned_nack() {
    let result = crate::sync::cursor::validate_since_seq(90, 100);
    assert_eq!(
      result,
      Err(crate::sync::protocol::SyncMsg::Nack {
        reason: "cursor_pruned".to_string(),
        recoverable: false,
      })
    );
  }

  #[test]
  fn identical_hlc_event_is_noop() {
    let hlc = crate::sync::hlc::Hlc {
      wall_ms: 1000,
      counter: 4,
    };

    let decision = crate::sync::apply::idempotent_apply_decision(hlc, hlc);
    assert_eq!(decision, crate::sync::apply::ApplyDecision::Noop);
  }

  #[test]
  fn pending_item_moves_to_dead_letter_after_max_retries() {
    let mut connection = diesel::sqlite::SqliteConnection::establish(":memory:")
      .expect("Failed to create in-memory sqlite connection");
    let options = crate::db::runtime_connection_options();
    options
      .on_acquire(&mut connection)
      .expect("Failed to configure sqlite connection");

    let migrations = FileBasedMigrations::find_migrations_directory()
      .expect("Failed to find migrations directory");
    connection
      .run_pending_migrations(migrations)
      .expect("Failed to run migrations");

    diesel::sql_query(
      "INSERT INTO sync_pending_apply (
         source_device_id, table_name, row_id, op, hlc_wall_ms, hlc_counter, updated_at, row_json, retry_count, created_at
       ) VALUES (
         'peer-a', 'items', 'row-1', 'update', 1000, 1, 1000, NULL, 3, 1000
       )",
    )
    .execute(&mut connection)
    .expect("Failed to insert pending row");

    let pending_id: i32 = diesel::sql_query("SELECT id FROM sync_pending_apply LIMIT 1")
      .load::<IdRow>(&mut connection)
      .expect("Failed to load pending id")[0]
      .id;

    let result = crate::sync::pending::process_pending_retry(
      &mut connection,
      pending_id,
      3,
      "dependency_missing",
    )
    .expect("Failed to process pending retry");

    assert_eq!(result, crate::sync::pending::PendingProcessResult::MovedToDeadLetter);
    assert_eq!(sync_pending_count(&mut connection), 0);
    assert_eq!(sync_dead_letter_count(&mut connection), 1);
  }

  #[test]
  fn snapshot_manifest_contains_checkpoint_seq() {
    let mut connection = diesel::sqlite::SqliteConnection::establish(":memory:")
      .expect("Failed to create in-memory sqlite connection");
    let options = crate::db::runtime_connection_options();
    options
      .on_acquire(&mut connection)
      .expect("Failed to configure sqlite connection");

    let migrations = FileBasedMigrations::find_migrations_directory()
      .expect("Failed to find migrations directory");
    connection
      .run_pending_migrations(migrations)
      .expect("Failed to run migrations");

    diesel::sql_query(
      "INSERT INTO sync_changes (
         source_device_id, table_name, row_id, op, hlc_wall_ms, hlc_counter, updated_at, row_json, created_at
       ) VALUES
         ('peer-a', 'items', 'row-1', 'insert', 1000, 1, 1000, '{}', 1000),
         ('peer-a', 'items', 'row-2', 'update', 1001, 2, 1001, '{}', 1001)",
    )
    .execute(&mut connection)
    .expect("Failed to seed sync_changes");

    let snapshot_dir = tempfile::tempdir().expect("Failed to create temp snapshot directory");
    let snapshot_path = snapshot_dir.path().join("snapshot.sqlite");

    let manifest = crate::sync::snapshot::create_snapshot(
      &mut connection,
      snapshot_path
        .to_str()
        .expect("Snapshot path should be valid UTF-8"),
    )
    .expect("Failed to build snapshot manifest");

    assert_eq!(manifest.checkpoint_seq, 2);
  }

  #[test]
  fn compaction_uses_min_trusted_non_stale_cursor() {
    let mut connection = diesel::sqlite::SqliteConnection::establish(":memory:")
      .expect("Failed to create in-memory sqlite connection");
    let options = crate::db::runtime_connection_options();
    options
      .on_acquire(&mut connection)
      .expect("Failed to configure sqlite connection");

    let migrations = FileBasedMigrations::find_migrations_directory()
      .expect("Failed to find migrations directory");
    connection
      .run_pending_migrations(migrations)
      .expect("Failed to run migrations");

    diesel::sql_query(
      "INSERT INTO sync_peer_cursor (
        peer_device_id, last_acked_seq, last_applied_seq, is_trusted, is_stale, last_seen_at, created_at, updated_at
      ) VALUES
        ('peer-500', 500, 500, 1, 0, 1000, 1000, 1000),
        ('peer-700-stale', 700, 700, 1, 1, 1000, 1000, 1000),
        ('peer-620', 620, 620, 1, 0, 1000, 1000, 1000),
        ('peer-400-untrusted', 400, 400, 0, 0, 1000, 1000, 1000)",
    )
    .execute(&mut connection)
    .expect("Failed to seed sync_peer_cursor");

    let floor = crate::sync::gc::compaction_floor_from_db(&mut connection)
      .expect("Failed to compute compaction floor");

    assert_eq!(floor, Some(500));
  }

  #[test]
  fn sync_mode_on_starts_discovery_and_transport() {
    let engine = crate::sync::engine::SyncEngine::default();
    engine
      .set_mode(crate::sync::types::SyncMode::On)
      .expect("Failed to set sync mode to On");

    let network = engine.network_snapshot();
    assert!(network.discovery_running);
    assert!(network.transport_running);
  }

  #[test]
  fn missing_blob_hash_triggers_media_fetch_job() {
    let mut connection = diesel::sqlite::SqliteConnection::establish(":memory:")
      .expect("Failed to create in-memory sqlite connection");
    let options = crate::db::runtime_connection_options();
    options
      .on_acquire(&mut connection)
      .expect("Failed to configure sqlite connection");

    let migrations = FileBasedMigrations::find_migrations_directory()
      .expect("Failed to find migrations directory");
    connection
      .run_pending_migrations(migrations)
      .expect("Failed to run migrations");

    let blob_hash = "blob-hash-missing-001";
    crate::sync::media::clear_fetch_queue();

    let queued = crate::sync::media::ensure_blob_available(&mut connection, blob_hash, 1000)
      .expect("Failed to ensure blob availability");
    assert!(queued);
    assert!(crate::sync::media::is_blob_fetch_queued(blob_hash));
  }

  #[test]
  fn unreferenced_blob_is_removed_by_gc() {
    use std::sync::{Arc, Mutex};

    struct TestBlobStore {
      deleted: Arc<Mutex<Vec<String>>>,
    }

    impl crate::sync::media::BlobStore for TestBlobStore {
      fn delete(&self, blob_hash: &str) -> Result<(), String> {
        self
          .deleted
          .lock()
          .map_err(|_| "Failed to lock deleted list".to_string())?
          .push(blob_hash.to_string());
        Ok(())
      }
    }

    let mut connection = diesel::sqlite::SqliteConnection::establish(":memory:")
      .expect("Failed to create in-memory sqlite connection");
    let options = crate::db::runtime_connection_options();
    options
      .on_acquire(&mut connection)
      .expect("Failed to configure sqlite connection");

    let migrations = FileBasedMigrations::find_migrations_directory()
      .expect("Failed to find migrations directory");
    connection
      .run_pending_migrations(migrations)
      .expect("Failed to run migrations");

    let media_root = tempfile::tempdir().expect("Failed to create media root");
    let local_rel_path = "blob-a.png";
    let local_file = media_root.path().join(local_rel_path);
    std::fs::write(&local_file, b"image-bytes").expect("Failed to write blob file");

    diesel::sql_query(
      "INSERT INTO sync_blob_refs (
         blob_hash, local_rel_path, mime_type, size_bytes, ref_count, last_seen_at, created_at, updated_at
       ) VALUES (
         'blob-a', ?, 'image/png', 10, 0, 1000, 1000, 1000
       )",
    )
    .bind::<Text, _>(local_rel_path.to_string())
    .execute(&mut connection)
    .expect("Failed to insert blob ref");

    let deleted = Arc::new(Mutex::new(Vec::new()));
    let store = TestBlobStore {
      deleted: deleted.clone(),
    };

    let removed_hashes = crate::sync::media::garbage_collect_unreferenced_blobs(
      &mut connection,
      &store,
      media_root.path(),
    )
    .expect("Failed to run blob GC");

    assert_eq!(removed_hashes, vec!["blob-a".to_string()]);
    assert!(!local_file.exists());

    let deleted_hashes = deleted.lock().expect("Failed to lock deleted list");
    assert_eq!(deleted_hashes.as_slice(), ["blob-a"]);

    let remaining: Vec<CountRow> = diesel::sql_query("SELECT COUNT(*) AS total FROM sync_blob_refs")
      .load(&mut connection)
      .expect("Failed to count sync_blob_refs rows");
    assert_eq!(remaining[0].total, 0);
  }

  #[test]
  fn encrypted_envelope_roundtrip_succeeds() {
    let key = crate::sync::security::keys::generate_data_key();
    let payload = br#"{"table":"items","row_id":"x-1","op":"update"}"#;

    let envelope = crate::sync::security::envelope::encrypt_payload(payload, &key)
      .expect("Failed to encrypt payload");
    let decrypted = crate::sync::security::envelope::decrypt_payload(&envelope, &key)
      .expect("Failed to decrypt payload");

    assert_eq!(decrypted, payload);
  }

  #[test]
  fn recovery_key_can_restore_wrapped_udk() {
    let udk = crate::sync::security::keys::generate_data_key();
    let recovery_key = crate::sync::commands::export_recovery_key();

    crate::sync::commands::import_recovery_key(&recovery_key)
      .expect("Failed to import recovery key");
    let recovery_key_bytes = crate::sync::security::keys::recovery_key_from_string(&recovery_key)
      .expect("Failed to decode recovery key");

    let wrapped = crate::sync::security::keys::wrap_data_key_with_recovery_key(
      &udk,
      &recovery_key_bytes,
    )
    .expect("Failed to wrap UDK with recovery key");

    let restored = crate::sync::security::keys::unwrap_data_key_with_recovery_key(
      &wrapped,
      &recovery_key_bytes,
    )
    .expect("Failed to unwrap UDK with recovery key");

    assert_eq!(restored, udk);
  }

  #[test]
  fn two_device_incremental_sync_converges() {
    let mut conn_a = diesel::sqlite::SqliteConnection::establish(":memory:")
      .expect("Failed to create device A sqlite connection");
    let mut conn_b = diesel::sqlite::SqliteConnection::establish(":memory:")
      .expect("Failed to create device B sqlite connection");
    let options = crate::db::runtime_connection_options();
    options
      .on_acquire(&mut conn_a)
      .expect("Failed to configure device A connection");
    options
      .on_acquire(&mut conn_b)
      .expect("Failed to configure device B connection");

    let migrations = FileBasedMigrations::find_migrations_directory()
      .expect("Failed to find migrations directory");
    conn_a
      .run_pending_migrations(migrations)
      .expect("Failed to run migrations for device A");
    let migrations = FileBasedMigrations::find_migrations_directory()
      .expect("Failed to find migrations directory");
    conn_b
      .run_pending_migrations(migrations)
      .expect("Failed to run migrations for device B");

    diesel::sql_query(
      "INSERT INTO items (
        item_id, name, is_active, is_disabled, is_deleted, is_folder, is_separator, is_board, is_menu, is_clip,
        layout_split, created_at, updated_at, created_date, updated_date
      ) VALUES (
        'sync-e2e-item-001', 'DeviceAItem', 1, 0, 0, 0, 0, 0, 0, 1,
        50, 1000, 1000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )",
    )
    .execute(&mut conn_a)
    .expect("Failed to insert source item on device A");

    let source_seq: i64 = diesel::sql_query("SELECT MAX(seq) AS seq FROM sync_changes")
      .load::<SeqRow>(&mut conn_a)
      .expect("Failed to read source seq")[0]
      .seq;

    {
      let mut remote_apply_guard =
        crate::sync::apply_context::enable_remote_apply_context(&mut conn_b)
          .expect("Failed to enable remote apply context on device B");
      diesel::sql_query(
        "INSERT INTO items (
          item_id, name, is_active, is_disabled, is_deleted, is_folder, is_separator, is_board, is_menu, is_clip,
          layout_split, created_at, updated_at, created_date, updated_date
        ) VALUES (
          'sync-e2e-item-001', 'DeviceAItem', 1, 0, 0, 0, 0, 0, 0, 1,
          50, 1000, 1000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )",
      )
      .execute(remote_apply_guard.conn_mut())
      .expect("Failed to apply replicated item on device B");
    }

    diesel::sql_query(
      "INSERT INTO sync_peer_cursor (
        peer_device_id, last_acked_seq, last_applied_seq, is_trusted, is_stale, last_seen_at, created_at, updated_at
      ) VALUES (
        'device-a', ?, ?, 1, 0, 1000, 1000, 1000
      )
      ON CONFLICT(peer_device_id) DO UPDATE SET
        last_acked_seq = excluded.last_acked_seq,
        last_applied_seq = excluded.last_applied_seq,
        updated_at = excluded.updated_at",
    )
    .bind::<BigInt, _>(source_seq)
    .bind::<BigInt, _>(source_seq)
    .execute(&mut conn_b)
    .expect("Failed to advance peer cursor on device B");

    let item_count: i64 = diesel::sql_query(
      "SELECT COUNT(*) AS total FROM items WHERE item_id = 'sync-e2e-item-001'",
    )
    .load::<CountRow>(&mut conn_b)
    .expect("Failed to count replicated items on device B")[0]
      .total;
    assert_eq!(item_count, 1);

    let cursor_seq: i64 = diesel::sql_query(
      "SELECT last_applied_seq FROM sync_peer_cursor WHERE peer_device_id = 'device-a'",
    )
    .load::<CursorRow>(&mut conn_b)
    .expect("Failed to read device B cursor")[0]
      .last_applied_seq;
    assert_eq!(cursor_seq, source_seq);

    let engine = crate::sync::engine::SyncEngine::default();
    engine.record_applied_events(1);
    let stats = engine
      .collect_stats(&mut conn_b)
      .expect("Failed to collect sync stats");

    assert_eq!(stats.applied_events, 1);
    assert_eq!(stats.pending_events, 0);
    assert_eq!(stats.dead_letter_events, 0);
  }

  #[test]
  fn clipboard_history_insert_emits_outbox_row_json() {
    let mut connection = diesel::sqlite::SqliteConnection::establish(":memory:")
      .expect("Failed to create in-memory sqlite connection");
    let options = crate::db::runtime_connection_options();
    options
      .on_acquire(&mut connection)
      .expect("Failed to configure sqlite connection");

    let migrations = FileBasedMigrations::find_migrations_directory()
      .expect("Failed to find migrations directory");
    connection
      .run_pending_migrations(migrations)
      .expect("Failed to run migrations");

    insert_minimal_history_row(&mut connection, "history-sync-trigger-001", 1000);

    let rows: Vec<SyncChangeRow> = diesel::sql_query(
      "SELECT table_name, row_id, row_json
       FROM sync_changes
       WHERE table_name = 'clipboard_history'
         AND row_id = 'history-sync-trigger-001'
       ORDER BY seq DESC
       LIMIT 1",
    )
    .load(&mut connection)
    .expect("Failed to query sync_changes for clipboard_history");

    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].table_name, "clipboard_history");
    assert_eq!(rows[0].row_id, "history-sync-trigger-001");
    assert!(rows[0].row_json.is_some(), "Expected row_json payload for history sync");
  }

  #[test]
  fn history_sync_apply_uses_lww_on_updated_at() {
    let mut connection = diesel::sqlite::SqliteConnection::establish(":memory:")
      .expect("Failed to create in-memory sqlite connection");
    let options = crate::db::runtime_connection_options();
    options
      .on_acquire(&mut connection)
      .expect("Failed to configure sqlite connection");

    let migrations = FileBasedMigrations::find_migrations_directory()
      .expect("Failed to find migrations directory");
    connection
      .run_pending_migrations(migrations)
      .expect("Failed to run migrations");

    let first_change = crate::sync::history_sync::HistorySyncChange {
      seq: 1,
      source_device_id: "peer-a".to_string(),
      op: "insert".to_string(),
      row_id: "history-lww-001".to_string(),
      hlc_wall_ms: 1000,
      hlc_counter: 1,
      updated_at: 2000,
      row_json: Some(
        serde_json::json!({
          "history_id": "history-lww-001",
          "title": "First",
          "value": "value-v1",
          "is_text": true,
          "created_at": 2000,
          "updated_at": 2000
        })
        .to_string(),
      ),
    };

    crate::sync::history_sync::apply_history_change(&mut connection, &first_change)
      .expect("Failed to apply first change");

    let stale_change = crate::sync::history_sync::HistorySyncChange {
      seq: 2,
      source_device_id: "peer-a".to_string(),
      op: "update".to_string(),
      row_id: "history-lww-001".to_string(),
      hlc_wall_ms: 1001,
      hlc_counter: 2,
      updated_at: 1500,
      row_json: Some(
        serde_json::json!({
          "history_id": "history-lww-001",
          "title": "Stale",
          "value": "value-stale",
          "is_text": true,
          "created_at": 1500,
          "updated_at": 1500
        })
        .to_string(),
      ),
    };

    crate::sync::history_sync::apply_history_change(&mut connection, &stale_change)
      .expect("Failed to apply stale change");

    let rows: Vec<HistoryValueRow> = diesel::sql_query(
      "SELECT value, updated_at
       FROM clipboard_history
       WHERE history_id = 'history-lww-001'
       LIMIT 1",
    )
    .load(&mut connection)
    .expect("Failed to query history row");

    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].value.as_deref(), Some("value-v1"));
    assert_eq!(rows[0].updated_at, 2000);
  }

  #[test]
  fn history_auto_sync_defaults_to_disabled() {
    let runtime = crate::sync::pairing_runtime::PairingRuntime::default();
    let snapshot = runtime.snapshot().expect("Failed to get pairing snapshot");
    assert!(!snapshot.history_auto_sync_enabled);
  }

  #[test]
  fn history_auto_sync_can_be_toggled() {
    let runtime = crate::sync::pairing_runtime::PairingRuntime::default();

    runtime
      .set_history_auto_sync_enabled(true)
      .expect("Failed to enable history auto sync");
    let enabled_snapshot = runtime.snapshot().expect("Failed to get pairing snapshot");
    assert!(enabled_snapshot.history_auto_sync_enabled);

    runtime
      .set_history_auto_sync_enabled(false)
      .expect("Failed to disable history auto sync");
    let disabled_snapshot = runtime.snapshot().expect("Failed to get pairing snapshot");
    assert!(!disabled_snapshot.history_auto_sync_enabled);
  }
}

