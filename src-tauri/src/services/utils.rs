use colored_json::ToColoredJson;
use html_escape;
use lazy_static::lazy_static;
use regex::Regex;
use serde::Serialize;
use serde_json::Value;
use std::fs;
use std::path::Path;

#[cfg(target_os = "windows")]
use winreg::RegKey;

use tld;
use url::Url;

use crate::menu::AssociatedItemTree;

use super::collections_service;

pub fn pretty_print_json<T: Serialize>(data: &Result<T, diesel::result::Error>) -> String {
  data
    .as_ref()
    .map(|_items| {
      serde_json::to_string_pretty(_items)
        .map_err(|_| "Failed to serialize to JSON.".to_string())
        .and_then(|json_str| {
          json_str
            .to_colored_json_auto()
            .map_err(|_| "Failed to colorize JSON.".to_string())
        })
        .unwrap_or_else(|err| err)
    })
    .unwrap_or("Error fetching data.".to_string())
}

pub fn pretty_print_struct<T: Serialize>(data: &T) -> String {
  serde_json::to_string_pretty(data)
    .map_err(|_| "Failed to serialize to JSON.".to_string())
    .and_then(|json_str| {
      json_str
        .to_colored_json_auto()
        .map_err(|_| "Failed to colorize JSON.".to_string())
    })
    .unwrap_or_else(|err| err)
}

fn print_tree(node: &AssociatedItemTree, indent: usize) -> String {
  let prefix = " ".repeat(indent);
  let mut result = format!("{}- {}\n", prefix, node.item.name);
  for child in &node.children {
    result.push_str(&print_tree(child, indent + 2));
  }
  result
}

pub fn pretty_print_forest(trees: &[AssociatedItemTree]) -> String {
  let mut result = String::new();
  for tree in trees {
    result.push_str(&print_tree(tree, 2));
  }
  result
}

pub fn print_db_items(items: &Vec<collections_service::AssociatedMenu>) {
  let serialized_output = pretty_print_struct(items);
  println!("{}", serialized_output);
}

pub fn delete_file_and_maybe_parent(file_path: &Path) -> Result<(), std::io::Error> {
  // Try deleting the file first
  fs::remove_file(file_path)?;

  // Check parent directory
  if let Some(parent) = file_path.parent() {
    // Check if directory is empty
    if parent.read_dir()?.next().is_none() {
      fs::remove_dir(parent)?;
    }
  }

  Ok(())
}

pub fn remove_dir_if_exists<P: AsRef<Path>>(path: P) -> std::io::Result<()> {
  if path.as_ref().exists() {
    fs::remove_dir_all(path)
  } else {
    Ok(())
  }
}

pub fn has_emoji(text: &str) -> bool {
  lazy_static! {
    static ref REGGIE_EMOJI: Regex = Regex::new(r"\p{RI}\p{RI}|\p{Emoji_Presentation}(\p{EMod}|\x{FE0F}\x{20E3}?|[\x{E0020}-\x{E007E}]+\x{E007F})?(\x{200D}[\p{Emoji_Presentation}--\p{Ascii}](\p{EMod}|\x{FE0F}\x{20E3}?|[\x{E0020}-\x{E007E}]+\x{E007F})?)*").unwrap();
  }
  REGGIE_EMOJI.is_match(text)
}

pub fn is_youtube_url(url: &str) -> bool {
  url.contains("youtube.com") || url.contains("youtu.be")
}

pub fn is_image_url(url: &str) -> bool {
  lazy_static! {
    static ref REGGIE_IMAGE_URL: Regex =
      Regex::new(r"^https?://(\S+?\.(?:jpe?g|png|gif|svg))").unwrap();
  }
  REGGIE_IMAGE_URL.is_match(url)
}

pub fn has_valid_tld(url: &str) -> bool {
  let parsed_url = Url::parse(&ensure_url_prefix(url));

  match parsed_url {
    Ok(url) => {
      if let Some(domain) = url.domain() {
        let parts: Vec<&str> = domain.split('.').collect();
        if let Some(tld) = parts.last() {
          return tld::exist(tld);
        }
      }
      false
    }
    Err(_) => false,
  }
}

pub fn ensure_url_or_email_prefix(url: &str) -> String {
  if url.contains('@') && !url.starts_with("mailto:") {
    return format!("mailto:{}", url);
  }

  if !url.starts_with("http://") && !url.starts_with("https://") {
    return format!("https://{}", url);
  }

  url.to_string()
}

pub fn ensure_url_prefix(url: &str) -> String {
  if !url.starts_with("http://") && !url.starts_with("https://") {
    return format!("https://{}", url);
  }

  url.to_string()
}

pub fn is_base64_image(data: &str) -> bool {
  lazy_static! {
    static ref REGGIE_BASE64_IMAGE: Regex =
      Regex::new(r"^data:image/(png|jpeg|jpg|svg\+xml|svg|gif);base64").unwrap();
  }
  REGGIE_BASE64_IMAGE.is_match(data)
}

pub fn decode_html_entities(encoded: &str) -> String {
  html_escape::decode_html_entities(encoded).to_string()
}

pub fn mask_value(value: &str) -> String {
  let mask_char = '•';

  value
    .split_whitespace()
    .map(|word| {
      let first_char = word.chars().next().unwrap().to_string();

      if word.chars().count() > 2 {
        let middle_len = word.chars().count() - 2;
        let last_char = word.chars().last().unwrap().to_string();
        let masked_middle: String = mask_char.to_string().repeat(middle_len);

        format!("{}{}{}", first_char, masked_middle, last_char)
      } else {
        let masked_middle: String = mask_char.to_string().repeat(1);

        format!("{}{}", first_char, masked_middle)
      }
    })
    .collect::<Vec<String>>()
    .join(" ")
}

pub fn remove_special_bbcode_tags(text: &str) -> String {
  let bbcode_patterns = vec![
    r"\[copy\](.+?)\[/copy\]",
    r"\[mask\](.+?)\[/mask\]",
    r"\[blank\](.+?)\[/blank\]",
    r"\[hl\](.+?)\[/hl\]",
    r"\[h\](.+?)\[/h\]",
    r"\[b\](.+?)\[/b\]",
    r"\[i\](.+?)\[/i\]",
    // Add more patterns here if necessary
  ];

  let mut result = text.to_string();

  for pattern in bbcode_patterns {
    let re = Regex::new(pattern).unwrap();
    result = re.replace_all(&result, "$1").to_string();
  }

  result
}

pub fn is_valid_json(text: &str) -> bool {
  serde_json::from_str::<Value>(text).is_ok()
}

pub fn debug_output<F: FnOnce()>(f: F) {
  if cfg!(debug_assertions) {
    f();
  }
}

#[cfg(target_os = "windows")]
const SUBKEY: &str = "Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";
#[cfg(target_os = "windows")]
const VALUE: &str = "SystemUsesLightTheme";

pub fn is_windows_system_uses_dark_theme() -> bool {
  #[cfg(target_os = "windows")]
  {
    let hkcu = RegKey::predef(winreg::enums::HKEY_CURRENT_USER);
    if let Ok(subkey) = hkcu.open_subkey(SUBKEY) {
      if let Ok(dword) = subkey.get_value::<u32, _>(VALUE) {
        return dword == 0;
      }
    }
  }
  false
}
