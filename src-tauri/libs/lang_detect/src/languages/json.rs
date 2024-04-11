use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static JSON: [LanguagePattern; 5] = [
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"^\{$"#).unwrap()),
    r#type: Type::MetaModule,
    near_top: Some(true),
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r#"^\s*".*"\s*:\s*(".+"|[0-9]+|null|true|false)\s*(,)?$"#).unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"^\s*".*"\s*:\s*(\{|\[)$"#).unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"^\s*".*"\s*:\s*\{.*\}\s*(,)?$"#).unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"^\s*".*"\s*:\s*\[.*\]\s*(,)?$"#).unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
];
