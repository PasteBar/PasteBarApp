use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock; // Import RwLock from std::sync

#[derive(Debug, Serialize, Deserialize)]
pub struct Translations {
  en: HashMap<String, String>,
  de: HashMap<String, String>,
  uk: HashMap<String, String>,
  fr: HashMap<String, String>,
  esES: HashMap<String, String>,
  ru: HashMap<String, String>,
  zhCN: HashMap<String, String>,
}

static CURRENT_LANGUAGE: Lazy<RwLock<String>> = Lazy::new(|| RwLock::new("en".to_string()));

static TRANSLATIONS: Lazy<Translations> = Lazy::new(|| {
  let yaml_str = include_str!("./translations.yaml");
  serde_yaml::from_str(yaml_str).expect("Failed to parse translations at compile time")
});

impl Translations {
  pub fn set_user_language(lang: &str) {
    let mut current_lang = CURRENT_LANGUAGE.write().unwrap();
    *current_lang = lang.to_string();
  }

  pub fn get(key: &str) -> String {
    let current_lang = CURRENT_LANGUAGE.read().unwrap();
    match TRANSLATIONS.get_lang(&current_lang) {
      Some(lang_map) => lang_map
        .get(key)
        .cloned()
        .unwrap_or_else(|| format!("Translation for '{}' not found.", key)),
      None => format!("Language '{}' not supported.", *current_lang),
    }
  }

  fn get_lang(&self, lang: &str) -> Option<&HashMap<String, String>> {
    match lang {
      "en" => Some(&self.en),
      "de" => Some(&self.de),
      "ru" => Some(&self.ru),
      "uk" => Some(&self.uk),
      "fr" => Some(&self.fr),
      "esES" => Some(&self.esES),
      "zhCN" => Some(&self.zhCN),
      _ => Some(&self.en),
    }
  }
}
