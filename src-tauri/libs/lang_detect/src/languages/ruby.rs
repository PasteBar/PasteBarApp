use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static RUBY: [LanguagePattern; 26] = [
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(require|include)\s+'[\w]+(\.rb)?'").unwrap()),
    r#type: Type::MetaImport,
    near_top: Some(true),
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"def\s+\w+\s*(\(.+\))?\s*\n").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"@\w+").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\.\w+\?").unwrap()),
    r#type: Type::ConstantBoolean,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"puts\s+("|').+("|')"#).unwrap()),
    r#type: Type::KeywordPrint,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"class [A-Z]\w*\s*<\s*([A-Z]\w*(::)?)+").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"attr_accessor\s+(:\w+(,\s*)?)+").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"elsif").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bmodule\s\S").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bBEGIN\s\{.*\}").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bEND\s\{.*\}").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"do\s*[|]\w+(,\s*\w+)*[|]").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"for (\w+|\(?\w+,\s*\w+\)?) in (.+)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"nil").unwrap()),
    r#type: Type::ConstantNull,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(require|include)\s+('?[\w+\.]+?'?)").unwrap()),
    r#type: Type::MetaImport,
    near_top: Some(true),
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r":\w+").unwrap()),
    r#type: Type::ConstantType,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"@@\w+").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\{\s*\|.*\|\s*.*\}").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bend\b").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bunless\b").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\belsif\b").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bcase\b").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bwhen\b").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\byield\b").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"[A-Z]\w*::[A-Z]\w*").unwrap()),
    r#type: Type::Macro,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r".*?\w+\s*=\s*\w+\.new").unwrap()),
    r#type: Type::Macro,
    near_top: None,
  },
];
