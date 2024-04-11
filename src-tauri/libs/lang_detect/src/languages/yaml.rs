use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static YAML: [LanguagePattern; 20] = [
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^\s+[A-Za-z0-9_.]+:\s*[^:]*$").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^\s+-\s+[A-Za-z0-9_. ]+:\s*.*$").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^( )*-( )(.*)$").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^( )*([A-Za-z0-9_. ]+):( )!!binary( )?(|)?$").unwrap()),
    r#type: Type::ConstantType,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^( )*([A-Za-z0-9_. ]+):( )\|$").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^( )*([A-Za-z0-9_. ]+):( )>$").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^( )*\?( )(.*)$").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^( )*\?( )\|$").unwrap()),
    r#type: Type::ConstantType,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^( )*<<:( )(\*)(.*)?$").unwrap()),
    r#type: Type::ConstantType,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^( )*([A-Za-z0-9_. ]+):(.*)?( )?\{$").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^( )*([A-Za-z0-9_. ]+):(.*)?( )?,$").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^%\w+").unwrap()),
    r#type: Type::KeywordVisibility,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^\s*&[A-Za-z0-9_.]+").unwrap()),
    r#type: Type::KeywordVisibility,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^\s*\*[A-Za-z0-9_.]+").unwrap()),
    r#type: Type::KeywordVisibility,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r":\s*\|$").unwrap()),
    r#type: Type::KeywordVisibility,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r":\s*>\$").unwrap()),
    r#type: Type::KeywordVisibility,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"<<:").unwrap()),
    r#type: Type::KeywordVisibility,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^\s*![A-Za-z0-9_.]+").unwrap()),
    r#type: Type::KeywordVisibility,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^\s*-\s*\w+:\s*\w+").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^\s*\w+:\s*[\{\[]").unwrap()),
    r#type: Type::KeywordVisibility,
    near_top: None,
  },
];
