use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static DART: [LanguagePattern; 19] = [
  // Main function
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"void\s+main\(\)").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // Function definitions
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\b\w+\s+\w+\([^)]*\)\s*\{").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // print statements
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"print\(.+\);").unwrap()),
    r#type: Type::KeywordPrint,
    near_top: None,
  },
  // Variable declaration with var (mutable)
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"var\s+\w+\s*=").unwrap()),
    r#type: Type::KeywordVariable,
    near_top: None,
  },
  // Variable declaration with final (immutable)
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"final\s+\w+\s*=").unwrap()),
    r#type: Type::KeywordVariable,
    near_top: None,
  },
  // Variable declaration with const
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"const\s+\w+\s*=").unwrap()),
    r#type: Type::KeywordVariable,
    near_top: None,
  },
  // if-else statements
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(else\s+)?if\s*\(.+\)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // while loop
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"while\s*\(.+\)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // for loop
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"for\s*\(.+\)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // Dart specific keywords
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\b(library|part|show|hide)\b").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  // Class declarations
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bclass\s+\w+\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Enum declarations
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\benum\s+\w+\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Extension methods
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"extension\s+\w+\s+on\s+\w+\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Mixin declarations
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bmixin\s+\w+\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Async keyword
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\basync\b").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  // Await keyword
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bawait\b").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  // Null safety
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\?\.\w").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // Avoid JavaScript confusion
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"document\.").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"window\.").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
];
