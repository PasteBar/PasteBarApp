use crate::services::translations::translations::Translations;
use crate::services::utils::debug_output;
use serde::{Deserialize, Serialize};
use serde_yaml::{self, Mapping};
use tauri::AppHandle;
use tauri::Manager;

use std::collections::{BTreeMap, HashMap};
use std::fs::{File, OpenOptions};
use std::io::{ErrorKind, Read, Write};
use std::path::Path;
use std::sync::Mutex;

use crate::models::Setting;

#[derive(Serialize, Deserialize, Debug)]
pub struct Translation {
  pub key: String,
  pub namespace: String,
  pub language: String,
  pub text: String,
}

#[tauri::command]
pub fn change_menu_language(language: String) -> String {
  debug_output(|| {
    println!("Changing menu language to: {}", language);
  });
  Translations::set_user_language(&language);
  "ok".to_string()
}

#[tauri::command(async)]
pub async fn update_translation_keys(translations: Vec<Translation>) -> Result<String, String> {
  if !cfg!(debug_assertions) {
    return Err("This command is only available in debug mode".to_string());
  }

  let base_path = std::env::var("MISSING_TRANSLATION_SAVE_PATH").unwrap();

  if base_path.is_empty() {
    return Err("MISSING_TRANSLATION_SAVE_PATH is not set".to_string());
  }

  for translation in translations.iter() {
    println!("Adding missing translation key {:?}", translation);

    let path_str = format!(
      "{}/{}/{}.yaml",
      base_path, translation.language, translation.namespace
    );

    let path = Path::new(&path_str);

    // Ensure the directory exists
    if let Some(parent) = path.parent() {
      if !parent.exists() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
      }
    }

    let mut file_map: HashMap<String, serde_yaml::Value> = match File::open(path) {
      Ok(mut file) => {
        let mut contents = String::new();
        file
          .read_to_string(&mut contents)
          .map_err(|e| e.to_string())?;
        serde_yaml::from_str(&contents).map_err(|e| e.to_string())?
      }
      Err(e) if e.kind() == ErrorKind::NotFound => HashMap::new(),
      Err(e) => return Err(e.to_string()),
    };

    let value_to_save = if let Some(separator_pos) = translation.text.rfind(":::") {
      translation
        .text
        .split_at(separator_pos)
        .1
        .trim_start_matches(":::")
    } else {
      &translation.text[..]
    };

    if let Some(separator_pos) = translation.key.find(":::") {
      let (parent_key, sub_key) = translation.key.split_at(separator_pos);
      let parent_key = parent_key;
      let sub_key = sub_key.trim_start_matches(":::");

      let entry = file_map
        .entry(parent_key.to_string())
        .or_insert_with(|| serde_yaml::Value::Mapping(Mapping::new()));
      if let serde_yaml::Value::Mapping(map) = entry {
        let mut sub_map: BTreeMap<String, serde_yaml::Value> = map
          .iter()
          .map(|(k, v)| (k.as_str().unwrap().to_string(), v.clone()))
          .collect();
        sub_map.insert(
          sub_key.to_string(),
          serde_yaml::Value::String(value_to_save.to_string()),
        );

        // Convert BTreeMap back to Mapping for serialization
        *map = sub_map
          .into_iter()
          .map(|(k, v)| (serde_yaml::Value::String(k), v))
          .collect();
      }
    } else {
      // Directly insert the key-value pair for keys without subkeys
      file_map.insert(
        translation.key.clone(),
        serde_yaml::Value::String(value_to_save.to_string()),
      );
    }

    // Convert HashMap to BTreeMap for sorting top-level keys
    let sorted_map: BTreeMap<String, serde_yaml::Value> = file_map.into_iter().collect();

    // Write the updated content back to the file
    let mut file = OpenOptions::new()
      .write(true)
      .create(true)
      .truncate(true)
      .open(path)
      .map_err(|e| {
        eprintln!("Failed to open file: {}", e);
        e.to_string()
      })?;

    let yaml = serde_yaml::to_string(&sorted_map).map_err(|e| e.to_string())?;
    // println!("YAML: {:?}", yaml);
    file.write_all(yaml.as_bytes()).map_err(|e| {
      eprintln!("Failed to write to file: {}", e);
      e.to_string()
    })?;

    println!("Updated translation key with text: {:?}", translation);
  }

  Ok("Added".to_string())
}
