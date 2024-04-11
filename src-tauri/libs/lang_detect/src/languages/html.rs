use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static HTML: [LanguagePattern; 8] = [
  // Matches the DOCTYPE declaration
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"<!DOCTYPE (html|HTML PUBLIC .+)>").unwrap()),
    r#type: Type::MetaModule,
    near_top: Some(true),
  },
  // Matches regular HTML tags
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"<[a-z0-9]+(\s+[a-z-]+=('|").+?('|"))*/*>"#).unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Matches HTML comments
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(?s)<!--(.*?)(-->)?").unwrap()),
    r#type: Type::CommentBlock,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"[a-z-]+=('|").+?('|")"#).unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  // Matches non-closed tags
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"<[a-z0-9]+(\s+[a-z-]+=('|").+?('|"))*>"#).unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Matches entity references
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"&[a-z0-9]+;"#).unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Matches class attribute
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bclass=").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Not className
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bclassName=").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
];
