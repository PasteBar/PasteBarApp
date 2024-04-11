use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static KOTLIN: [LanguagePattern; 16] = [
  // Main function
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"fun main\((.*)?\) \{").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // Function definitions
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(inline|private|public|protected|override|operator(\s+))?fun(\s+)([A-Za-z0-9_])(\s+)?\((.*)\)(\s+)(\{|=)").unwrap()
    }),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // println statements
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"println\((.*?)\)(\n|;)?").unwrap()),
    r#type: Type::KeywordPrint,
    near_top: None,
  },
  // if-else statements
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(else )?if\s*\(.+\)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // while loop
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"while\s+\(.+\)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // Variable declaration with val (immutable)
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(
        r#"(const)?\s*val\s+[A-Za-z0-9_]+\s*:\s*\([^)]*\)\s*->\s*[A-Za-z0-9_]+\s*=\s*\{[^}]*\}"#,
      )
      .unwrap()
    }),
    r#type: Type::KeywordVariable,
    near_top: None,
  },
  // Variable declaration with var (mutable)
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"var(\s+)(.*)(:(\s)(.*)(\?)?)?(\s+)=(\s+)").unwrap()),
    r#type: Type::KeywordVariable,
    near_top: None,
  },
  // Class declarations
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^(\s+)?(inner|open|data)(\s+)class").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Imports
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^import\s+[a-zA-Z0-9_.]+;$").unwrap()),
    r#type: Type::MetaImport,
    near_top: Some(true),
  },
  // Typealias
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"typealias(\s+)(.*)(\s+)=\s*([A-Za-z0-9_.]+)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // Companion objects
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"companion(\s+)object").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // When expressions
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"when(\s+)(\((.*)\)\s+)?\{$").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // Kotlin Extensions
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"fun\s+[A-Za-z0-9_]+\.([A-Za-z0-9_]+)\s*\(").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // Kotlin Lambdas
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\{\s*([A-Za-z0-9_]+) ->").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // Null Safety with ?
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"[A-Za-z0-9_]+(\?)\.").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"import\s*\([\s\S]*?\)").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
];
