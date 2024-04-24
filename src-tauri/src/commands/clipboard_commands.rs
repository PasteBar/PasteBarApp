use crate::models::models::UpdatedItemData;
use crate::services::history_service;

use crate::services::items_service::update_item_by_id;
use crate::services::request_service::{
  run_web_request, run_web_scraping, HttpRequest, HttpScraping,
};
use crate::services::shell_service::{
  run_shell_command, ExecHomeDir, OutputRegexFilter, OutputTemplate,
};
use crate::services::utils::{
  ensure_url_or_email_prefix, ensure_url_prefix, mask_value, remove_special_bbcode_tags,
};
use crate::{constants, services::items_service::get_item_by_id};
use arboard::{Clipboard, ImageData};
use constants::IMAGE_NOT_FOUND_BASE64;
use image::GenericImageView;
use inputbot::KeybdKey::*;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::collections::HashMap;
use std::{thread, time::Duration};
use tauri::{self, AppHandle};
use tauri::{ClipboardManager, Manager};

#[derive(Debug, Serialize, Deserialize)]

pub enum ClipFormKeyPress {
  Enter,
  Tab,
  TabTab,
  TabTabTab,
  TabEnter,
  TabTabEnter,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormField {
  pub press_keys_after_paste: Option<ClipFormKeyPress>,
  pub is_press_keys_only: Option<bool>,
  pub is_delay_only: Option<bool>,
  pub value: Option<String>,
  pub is_enable: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormTemplateOptions {
  pub form_options: FormOptions,
  pub template_options: Vec<TemplateOption>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormOptions {
  pub fields: Vec<FormField>,
  pub open_url: Option<String>,
  pub is_open_url_disabled: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateOption {
  pub id: Option<String>,
  pub label: Option<String>,
  pub value: Option<String>,
  pub is_value_masked: Option<bool>,
  pub select_options: Option<Vec<String>>,
  pub is_enable: Option<bool>,
}

#[tauri::command]
pub fn copy_text(app_handle: AppHandle, text: String) -> String {
  let mut manager = app_handle.clipboard_manager();

  manager
    .write_text(text)
    .expect("failed to write to clipboard");

  "ok".to_string()
}

#[tauri::command]
pub fn copy_paste(app_handle: AppHandle, text: String, delay: i32) -> String {
  let mut manager = app_handle.clipboard_manager();

  manager
    .write_text(text)
    .expect("failed to write to clipboard");

  #[cfg(target_os = "macos")]
  fn query_accessibility_permissions() -> bool {
    macos_accessibility_client::accessibility::application_is_trusted_with_prompt()
  }

  #[cfg(target_os = "windows")]
  fn query_accessibility_permissions() -> bool {
    return true;
  }

  if delay > 0 {
    thread::sleep(Duration::from_secs(delay as u64));
  }

  #[cfg(any(target_os = "windows", target_os = "macos"))]
  if query_accessibility_permissions() {
    VKey.press_paste();
  }

  "ok".to_string()
}

#[tauri::command]
pub fn copy_history_item(app_handle: AppHandle, history_id: String) -> String {
  let history_item = match history_service::get_clipboard_history_by_id(&history_id) {
    Some(item) => item,
    None => return "History item not found".to_string(),
  };

  let mut manager = app_handle.clipboard_manager();

  if let (Some(true), Some(false)) = (history_item.is_image, history_item.is_link) {
    let base64_image = match history_item.image_path_full_res {
      Some(path) => match std::fs::read(&path) {
        Ok(img_data) => base64::encode(&img_data),
        Err(e) => {
          eprintln!("Failed to read image from path: {}", e);
          IMAGE_NOT_FOUND_BASE64.to_string()
        }
      },
      None => IMAGE_NOT_FOUND_BASE64.to_string(),
    };

    match write_image_to_clipboard(base64_image) {
      Ok(_) => "ok".to_string(),
      Err(e) => {
        eprintln!("Failed to write image to clipboard: {}", e);
        "Failed to write image to clipboard".to_string()
      }
    }
  } else {
    let value = match history_item.value {
      Some(val) => val,
      None => return "History item value is missing".to_string(),
    };

    match manager.write_text(value) {
      Ok(_) => "ok".to_string(),
      Err(e) => {
        eprintln!("Failed to write to clipboard: {}", e);
        "Failed to write to clipboard".to_string()
      }
    }
  }
}

#[tauri::command]
pub fn copy_paste_history_item(app_handle: AppHandle, history_id: String, delay: i32) -> String {
  copy_history_item(app_handle, history_id);
  paste_clipboard(delay)
}

pub fn write_image_to_clipboard(base64_image: String) -> Result<(), String> {
  let mut clipboard = Clipboard::new().unwrap();
  let decoded = base64::decode(&base64_image).map_err(|err| err.to_string())?;
  let img = image::load_from_memory(&decoded).map_err(|err| err.to_string())?;
  let pixels = img
    .pixels()
    .into_iter()
    .map(|(_, _, pixel)| pixel.0)
    .flatten()
    .collect::<Vec<_>>();
  let img_data = ImageData {
    height: img.height() as usize,
    width: img.width() as usize,
    bytes: Cow::Owned(pixels),
  };
  clipboard
    .set_image(img_data)
    .map_err(|err| err.to_string())?;
  Ok(())
}

#[tauri::command(async)]
pub async fn copy_clip_item(
  app_handle: AppHandle,
  item_id: String,
  copy_from_menu: bool,
) -> String {
  // Fetch the item from the database
  let item = match get_item_by_id(item_id.clone()) {
    Ok(i) => i,
    Err(e) => {
      eprintln!("Failed to find item: {}", e);
      return "Item not found".to_string();
    }
  };

  let mut manager = app_handle.clipboard_manager();

  if let (Some(true), true) = (item.is_link, copy_from_menu) {
    match &item.value {
      Some(link) => match opener::open(ensure_url_or_email_prefix(link)) {
        Ok(_) => return "link_or_app".to_string(),
        Err(e) => return format!("Failed to open url: {}", e),
      },
      None => return "Url path is not valid".to_string(),
    }
  } else if let (Some(true), true) = (item.is_path, copy_from_menu) {
    match &item.value {
      Some(app_path) => match opener::open(app_path) {
        Ok(_) => return "link_or_app".to_string(),
        Err(e) => return format!("Failed to open app path: {}", e),
      },
      None => return "App path is not valid".to_string(),
    }
  } else if let Some(true) = item.is_template {
    if let Some(template_options) = &item.form_template_options {
      let all_options: Result<FormTemplateOptions, _> = serde_json::from_str(&template_options);

      match all_options {
        Ok(options) => {
          match run_template_fill(
            app_handle,
            item.value.clone(),
            options.template_options,
            None,
          ) {
            Ok(filled_template) => {
              manager
                .write_text(&filled_template)
                .expect("Failed to write to clipboard");

              "ok".to_string()
            }
            Err(e) => {
              eprintln!("Failed to fill template: {}", e);
              return "Failed to fill template".to_string();
            }
          }
        }
        Err(e) => {
          eprintln!("Failed to deserialize template options: {}", e);
          return "Template options are not valid".to_string();
        }
      }
    } else {
      return "Template options are not provided".to_string();
    }
  } else if let Some(true) = item.is_form {
    if let Some(form_options) = &item.form_template_options {
      let all_options: FormTemplateOptions =
        serde_json::from_str(&form_options).unwrap_or_else(|_| FormTemplateOptions {
          form_options: FormOptions {
            fields: Vec::new(),
            open_url: None,
            is_open_url_disabled: None,
          },
          template_options: Vec::new(),
        });

      run_form_fill(app_handle, all_options.form_options)
        .await
        .unwrap_or_else(|e| e)
    } else {
      return "Form options are not valid".to_string();
    }
  } else if let Some(true) = item.is_command {
    if let Some(command) = &item.value {
      let request_options = item
        .request_options
        .clone()
        .unwrap_or_else(|| "".to_string());
      let options: HashMap<String, serde_json::Value> =
        serde_json::from_str(&request_options).unwrap_or_else(|_| HashMap::new());

      let output_template = if let Some(output_template_json) = options.get("outputTemplate") {
        serde_json::from_value::<OutputTemplate>(output_template_json.clone()).ok()
      } else {
        None
      };

      let output_regex_filter = if let Some(output_template_json) = options.get("outputRegexFilter")
      {
        serde_json::from_value::<OutputRegexFilter>(output_template_json.clone()).ok()
      } else {
        None
      };

      let exec_home_dir = if let Some(output_template_json) = options.get("execHomeDir") {
        serde_json::from_value::<ExecHomeDir>(output_template_json.clone()).ok()
      } else {
        None
      };

      match run_shell_command(command, exec_home_dir, output_template, output_regex_filter) {
        Ok(response) => {
          manager
            .write_text(&response)
            .expect("Failed to write to clipboard");
          handle_response(&app_handle, item_id.clone(), response);
          "ok".to_string()
        }
        Err(e) => {
          handle_response(
            &app_handle,
            item_id.clone(),
            format!("[Err]{}", e.to_string()),
          );
          "Command execution failed".to_string()
        }
      }
    } else {
      "Command is not valid".to_string()
    }
  } else if let Some(true) = item.is_web_scraping {
    if let (Some(request_options), Some(url)) = (&item.request_options, &item.value) {
      let mut options: HashMap<String, serde_json::Value> =
        serde_json::from_str(request_options).unwrap_or_else(|_| HashMap::new());

      options.insert("url".to_string(), serde_json::Value::String(url.clone()));
      options.remove("headers");

      let options_json = serde_json::to_string(&options).unwrap();

      thread::sleep(Duration::from_secs(1 as u64));

      let request = match serde_json::from_str::<HttpScraping>(&options_json) {
        Ok(req) => req,
        Err(_) => {
          return "Failed to parse scraping options".to_string();
        }
      };

      match run_web_scraping(request).await {
        Ok(response) => {
          let content = response.scrapped_body.unwrap_or(response.body);
          manager
            .write_text(&content)
            .expect("Failed to write to clipboard");
          handle_response(&app_handle, item_id.clone(), content);
          "ok".to_string()
        }
        Err(e) => {
          eprintln!("Web scraping failed: {}", e);
          handle_response(
            &app_handle,
            item_id.clone(),
            format!("[Err]{}", e.to_string()),
          );
          "Web scraping failed".to_string()
        }
      }
    } else {
      "Scraping options are not valid".to_string()
    }
  } else if let Some(true) = item.is_web_request {
    if let (Some(request_options), Some(url)) = (&item.request_options, &item.value) {
      // Parse request_options into a HashMap or similar structure
      let mut options: HashMap<String, serde_json::Value> =
        serde_json::from_str(request_options).unwrap_or_else(|_| HashMap::new());

      // Set the URL from item.value
      options.insert("url".to_string(), serde_json::Value::String(url.clone()));

      let options_json = serde_json::to_string(&options).unwrap();

      thread::sleep(Duration::from_secs(1 as u64));
      let request = match serde_json::from_str::<HttpRequest>(&options_json) {
        Ok(req) => req,
        Err(_) => {
          return "Failed to parse request options".to_string();
        }
      };

      match run_web_request(request).await {
        Ok(response) => {
          let content = response.filtered_body.unwrap_or(response.body);

          if response.status >= 400 {
            handle_response(&app_handle, item_id.clone(), format!("[Err]{}", content));
            return "Web request failed".to_string();
          }

          manager
            .write_text(&content)
            .expect("Failed to write to clipboard");
          handle_response(&app_handle, item_id.clone(), content);
          "ok".to_string()
        }
        Err(e) => {
          eprintln!("Web request failed: {}", e);
          handle_response(
            &app_handle,
            item_id.clone(),
            format!("[Err]{}", e.to_string()),
          );
          "Web request failed".to_string()
        }
      }
    } else {
      "Request is no valid".to_string()
    }
  } else if let (Some(true), Some(false)) = (item.is_image, item.is_link) {
    let base64_image = match item.image_path_full_res {
      Some(path) => match std::fs::read(&path) {
        Ok(img_data) => base64::encode(&img_data),
        Err(e) => {
          eprintln!("Failed to read image from path: {}", e);
          IMAGE_NOT_FOUND_BASE64.to_string()
        }
      },
      None => IMAGE_NOT_FOUND_BASE64.to_string(),
    };

    match write_image_to_clipboard(base64_image) {
      Ok(_) => "ok".to_string(),
      Err(e) => {
        eprintln!("Failed to write image to clipboard: {}", e);
        "Failed to write image to clipboard".to_string()
      }
    }
  } else if let Some(text) = item.value {
    let clean_text = if text.trim().is_empty() {
      item.name
    } else {
      remove_special_bbcode_tags(&text)
    };

    match manager.write_text(clean_text) {
      Ok(_) => "ok".to_string(),
      Err(e) => {
        eprintln!("Failed to write to clipboard: {}", e);
        "Failed to write to clipboard".to_string()
      }
    }
  } else {
    "Item is not valid".to_string()
  }
}

#[tauri::command(async)]
pub async fn copy_paste_clip_item_from_menu(
  app_handle: AppHandle,
  item_id: String,
  _delay: i32,
) -> String {
  let is_link_or_app = copy_clip_item(app_handle, item_id.clone(), true).await;

  if is_link_or_app == "link_or_app".to_string() {
    return "ok".to_string();
  }

  if is_link_or_app == "ok".to_string() {
    println!("before delay");

    if _delay > 0 {
      tokio::time::sleep(tokio::time::Duration::from_secs(_delay as u64)).await;
    }

    return paste_clipboard(0);
  }

  is_link_or_app
}

#[tauri::command(async)]
pub async fn copy_paste_clip_item(
  app_handle: AppHandle,
  item_id: String,
  delay: i32,
  is_copy_only: bool,
) -> String {
  copy_clip_item(app_handle, item_id.clone(), false).await;
  if is_copy_only {
    return "ok".to_string();
  }
  paste_clipboard(delay)
}

#[tauri::command(async)]
pub async fn run_form_fill(
  app_handle: AppHandle,
  form_options: FormOptions,
) -> Result<String, String> {
  let mut manager = app_handle.clipboard_manager();

  if let Some(open_url) = &form_options.open_url {
    if form_options.is_open_url_disabled != Some(true) {
      opener::open(ensure_url_prefix(open_url))
        .map_err(|e| format!("Failed to open url: {}", e))?;
      tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    }
  }

  for field in form_options
    .fields
    .iter()
    .filter(|f| f.is_enable.unwrap_or(false))
  {
    if let Some(true) = field.is_delay_only {
      let delay_seconds = field
        .value
        .as_deref()
        .unwrap_or_default()
        .trim_end_matches('s')
        .parse::<u64>()
        .unwrap_or(0);

      if delay_seconds > 0 {
        tokio::time::sleep(tokio::time::Duration::from_secs(delay_seconds)).await;
      }
      continue;
    }
    if let Some(true) = field.is_press_keys_only {
      if let Some(value) = &field.press_keys_after_paste {
        tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
        simulate_key_press(value).await;
      }
      continue;
    }
    if let Some(value) = &field.value {
      tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;

      manager
        .write_text(value.clone())
        .map_err(|e| format!("Failed to write to clipboard: {}", e))?;

      tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;

      paste_clipboard(0);

      // Handle key presses after paste
      if let Some(key_press) = &field.press_keys_after_paste {
        tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
        simulate_key_press(key_press).await;
      }
    }
  }

  Ok("ok".to_string())
}

#[tauri::command]
pub fn run_template_fill(
  app_handle: AppHandle,
  template_value: Option<String>,
  template_options: Vec<TemplateOption>,
  is_preview: Option<bool>,
) -> Result<String, String> {
  let manager = app_handle.clipboard_manager();
  let mut replaced_template = template_value.unwrap_or_default();

  if replaced_template.is_empty() || replaced_template == "null" {
    return Ok("".to_string());
  }

  for field in template_options
    .iter()
    .filter(|f| f.is_enable.unwrap_or(false))
  {
    if let Some(true) = field.is_enable {
      if let Some(value) = &field.value {
        let regex = regex::Regex::new(&format!(
          r"(?i)\{{\{{\s*{}\s*\}}\}}",
          regex::escape(field.label.as_deref().unwrap_or_default())
        ))
        .map_err(|e| format!("Invalid regex: {}", e))?;

        if field
          .label
          .as_deref()
          .unwrap_or_default()
          .eq_ignore_ascii_case("clipboard")
        {
          let clipboard_text = manager.read_text().unwrap_or(None).unwrap_or_default();

          if is_preview.unwrap_or(false) && field.is_value_masked.unwrap_or(false) {
            replaced_template = regex
              .replace_all(&replaced_template, mask_value(&clipboard_text))
              .to_string();
            continue;
          }

          replaced_template = regex
            .replace_all(&replaced_template, &clipboard_text)
            .to_string();
        } else {
          replaced_template = regex
            .replace_all(&replaced_template, value.as_str())
            .to_string();
        }
      }
    }
  }

  replaced_template = regex::Regex::new(r"(?i)\{\{\s*[^}]*\s*\}\}")
    .unwrap()
    .replace_all(&replaced_template, "")
    .to_string();

  Ok(replaced_template)
}

pub fn paste_clipboard(delay: i32) -> String {
  // Delay before pasting, if specified
  if delay > 0 {
    thread::sleep(Duration::from_secs(delay as u64));
  }
  #[cfg(target_os = "macos")]
  fn query_accessibility_permissions() -> bool {
    macos_accessibility_client::accessibility::application_is_trusted_with_prompt()
  }

  #[cfg(target_os = "windows")]
  fn query_accessibility_permissions() -> bool {
    return true;
  }

  if delay > 0 {
    thread::sleep(Duration::from_secs(delay as u64));
  }

  #[cfg(any(target_os = "windows", target_os = "macos"))]
  if query_accessibility_permissions() {
    VKey.press_paste();
  }

  "ok".to_string()
}

fn handle_response(app_handle: &AppHandle, item_id: String, content: String) {
  let updated_data = UpdatedItemData {
    command_request_output: Some(content),
    ..Default::default()
  };

  update_item_by_id(item_id, updated_data);
  let _ = app_handle.emit_all("clips://clips-monitor/update", "update".to_string());
}

async fn simulate_key_press(key_press: &ClipFormKeyPress) {
  match key_press {
    ClipFormKeyPress::Enter => {
      VKey.press_enter();
    }
    ClipFormKeyPress::Tab => {
      VKey.press_tab();
    }
    ClipFormKeyPress::TabTab => {
      VKey.press_tab();
      VKey.press_tab();
    }
    ClipFormKeyPress::TabTabTab => {
      VKey.press_tab();
      VKey.press_tab();
      VKey.press_tab();
    }
    ClipFormKeyPress::TabEnter => {
      VKey.press_tab();
      VKey.press_enter();
    }
    ClipFormKeyPress::TabTabEnter => {
      VKey.press_tab();
      VKey.press_tab();
      VKey.press_enter()
    }
  }
}
