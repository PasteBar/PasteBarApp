use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static C: [LanguagePattern; 23] = [
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(char|long|int|float|double)\s+\w+\s*=?").unwrap()),
    r#type: Type::ConstantType,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"malloc\(.+\)").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"#include (<|")\w+\.h(>|")"#).unwrap()),
    r#type: Type::MetaImport,
    near_top: Some(true),
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(\w+)\s*\*\s*\w+").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(\w+)\s+\w+(;|\s*=)").unwrap()),
    r#type: Type::Macro,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(\w+)\s+\w+\[.+\]").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"#define\s+.+").unwrap()),
    r#type: Type::Macro,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"NULL").unwrap()),
    r#type: Type::ConstantNull,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"void").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(printf|puts)\s*\(.+\)").unwrap()),
    r#type: Type::KeywordPrint,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"new \w+").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"new [A-Z]\w*\s*\(.+\)").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"'.{2,}'").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"var\s+\w+\s*=?").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"def\s+\w+\s*(\(.+\))?\s*\n").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"puts\s+("|').+("|')"#).unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"Console\.(WriteLine|Write)(\s*)?\(").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(using\s)?System(\..*)?(;)?").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(public\s)?((partial|static|delegate)\s)?(class\s)").unwrap()
    }),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(public|private|protected|internal)").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(new|this\s)?(List|IEnumerable)<(sbyte|byte|short|ushort|int|uint|long|ulong|float|double|decimal|bool|char|string)>").unwrap()
    }),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"local\s(function|\w+)?").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^(void\s)?main\(\)\s(async\s)?\{").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
];
