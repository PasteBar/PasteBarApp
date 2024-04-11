use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static JSX: [LanguagePattern; 15] = [
  // Matches JSX expressions within curly braces within <tag> or <Tag> blocks
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r#"<[A-Za-z]+\b[^>]*>\s*\{\s*[^\{\}]*?\b\w+\.\b\w+\s*\([^\{\}]*?\)\s*\}.*?</[A-Za-z]+\b>|<[A-Za-z]+\b[^>]*>\s*\{\s*[^\{\}]*?\b\w+\.\b\w+\s*\([^\{\}]*?\)\s*\}\s*/>"#).unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Matches JSX tags with expressions inside
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r#"\(\s*<[A-Z][a-zA-Z0-9]*.*?>.*?\{.*?\}.*?</[A-Z][a-zA-Z0-9]*>\s*\)"#).unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Matches JSX self-closing tags with expressions inside
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r#"\(\s*<[A-Z][a-zA-Z0-9]*.*?/?>.*?\{.*?\}.*?\s*\)"#).unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Matches JSX ternary expressions
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r#"\{\s*.*?\?\s*\(.*?<[A-Z][a-zA-Z0-9]*.*?>.*?\{.*?\}.*?</[A-Z][a-zA-Z0-9]*>\s*\)\s*:\s*\(.*?<[A-Z][a-zA-Z0-9]*.*?>.*?\{.*?\}.*?</[A-Z][a-zA-Z0-9]*>\s*\)\s*\}"#).unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Matches JSX tags with expressions inside
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r#"<[A-Z][a-zA-Z0-9]*.*?>.*?\{.*?\}.*?</[A-Z][a-zA-Z0-9]*>"#).unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"\s*[>/]+\s*$"#).unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"\s*<[^/][^>]*>\s*$|^\s*</[^>]+>\s*$"#).unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"<[A-Za-z]+\b[^>]*\s*$"#).unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Matches JSX self-closing tags with expressions inside
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"<[A-Z][a-zA-Z0-9]*.*?/?>.*?\{.*?\}.*?"#).unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  }, // Matches JSX self-closing tags
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"<[A-Z][a-zA-Z0-9]*.*?/?>"#).unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Matches .map() within <tag> or <Tag> blocks
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r#"<[A-Za-z]+\b[^>]*>\s*\.\s*map\s*\(\s*.*?\s*\).*?</[A-Za-z]+\b>|<[A-Za-z]+\b[^>]*>\s*\.\s*map\s*\(\s*.*?\s*\)\s*/>"#).unwrap()
    }),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  // Matches JSX expressions within curly braces within <tag> or <Tag> blocks
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r#"<[A-Za-z]+\b[^>]*>\s*\{\s*[^\{\}]*?\b\w+\.\b\w+\s*\([^\{\}]*?\)\s*\}.*?</[A-Za-z]+\b>|<[A-Za-z]+\b[^>]*>\s*\{\s*[^\{\}]*?\b\w+\.\b\w+\s*\([^\{\}]*?\)\s*\}\s*/>"#).unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(
        r#"<[A-Za-z][A-Za-z0-9_]*\s*=\s*\{.*?\}\s*(?:\/>|>)|<\/[A-Za-z][A-Za-z0-9_]*\s*\/?>"#,
      )
      .unwrap()
    }),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  // Match className=
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bclassName=").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  // Match not class=
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bclass=").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
];
