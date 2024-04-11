use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static PYTHON: [LanguagePattern; 17] = [
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"def\s+\w+\(.*\)\s*:").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"while (.+):").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"^from\s+[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*\s+import\s+[a-zA-Z_][a-zA-Z0-9_]*(, [a-zA-Z_][a-zA-Z0-9_]*)*$").unwrap()
    }),
    r#type: Type::MetaImport,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"class\s*\w+(\(\s*\w+\s*\))?\s*:").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"if\s+(.+)\s*:").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"elif\s+(.+)\s*:").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"else:").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"for (\w+|\(?\w+,\s*\w+\)?) in (.+):").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\w+\s*=\s*\w+(.)(\n|$)").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"^import\s+[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$").unwrap()
    }),
    r#type: Type::MetaImport,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"print((\s*\(.+\))|\s+.+)").unwrap()),
    r#type: Type::KeywordPrint,
    near_top: None,
  },
  // Not-Python patterns:
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(&{2}|\|{2})").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"elseif").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"local\s(function|\w+)?\s=\s").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"fun main\((.*)?\) \{").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(inline(\s+))?fun(\s+)([A-Za-z0-9_])(\s+)?\((.*)\)(\s+)(\{|=)").unwrap()
    }),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(const)?(\s+)?val(\s+)(.*)(:(\s)(.*)(\?)?)?(\s+)=(\s+)").unwrap()
    }),
    r#type: Type::Not,
    near_top: None,
  },
];
