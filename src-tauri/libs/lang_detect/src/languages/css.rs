use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static CSS: [LanguagePattern; 2] = [
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"[a-z-]+:.+;").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"<(\/)?style>").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
];
