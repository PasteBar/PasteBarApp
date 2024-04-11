use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static REGEX: [LanguagePattern; 9] = [
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(\A|\s|[({\[<])\/[^\/]+\/[gimuy]{0,5}?").unwrap()),
    r#type: Type::Regex,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r#"re\.(match|search|findall|compile)\(['\"].+?['\"]"#).unwrap()
    }),
    r#type: Type::Regex,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"%r\{.+?\}").unwrap()),
    r#type: Type::Regex,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"(\W|^)Pattern\.compile\(".+?"\)"#).unwrap()),
    r#type: Type::Regex,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"/\^#?\([a-f0-9]\{\d*\}|\[a-f0-9]\{\d*\}\)\/i").unwrap()),
    r#type: Type::Regex,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"/\^[+-]?(\[0-9]\*\[.])?\[0-9]+\$/").unwrap()),
    r#type: Type::Regex,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"(\W|^)Regex::new\(".+?"\)"#).unwrap()),
    r#type: Type::Regex,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"/\^?\(.*\)\[.*\].*\$?/").unwrap()),
    r#type: Type::Regex,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"(\W|^)regexp\.MustCompile\(".+?"\)"#).unwrap()),
    r#type: Type::Regex,
    near_top: None,
  },
];
