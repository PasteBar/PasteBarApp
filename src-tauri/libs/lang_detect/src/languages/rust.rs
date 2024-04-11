use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static RUST: [LanguagePattern; 44] = [
  // Function main entry
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"fn\s+main\(\)").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // Function with return type and possible visibility
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(pub\s)?fn\s+[A-Za-z0-9<>,]+\([^)]*\)\s*->\s*\w+(\s*\{)?").unwrap()
    }),
    r#type: Type::KeywordVisibility,
    near_top: None,
  },
  // Mutable variable declaration
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"let\s+mut\s+\w+(\s*=\s*[^;]*)?;").unwrap()),
    r#type: Type::KeywordVariable,
    near_top: None,
  },
  // Macros
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\w+!\([^)]*\)").unwrap()),
    r#type: Type::Macro,
    near_top: None,
  },
  // Imports
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"use\s+\w+::.*;").unwrap()),
    r#type: Type::MetaImport,
    near_top: Some(true),
  },
  // Debug format
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\{:\?}").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  // loop control
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"loop\s+\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // Rust specific keywords
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\b(impl|crate|extern|macro|box)\b").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  // match control
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"match\s+\w+\s+\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // Length of collections
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\w+\.len\(\)").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  // Data types
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\b(&str|(i|u)(8|16|32|64|128|size))\b").unwrap()),
    r#type: Type::ConstantType,
    near_top: None,
  },
  // Vector declaration
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\b(Vec|Vec::new)\b|vec!").unwrap()),
    r#type: Type::ConstantType,
    near_top: None,
  },
  // Traits and wrapped values
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\b(Ok|Err|Box|ToOwned|Clone)\b").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  // Panic macro
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"panic!\([^)]*\)").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // Option
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bOption<\w+>\b").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // Result
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bResult<\w+, \w+>\b").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // Unwrap
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\.unwrap\(\)").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Lifetime annotations
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"<\s*'\w+\s*>").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // Result
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\benum\s+\w+\s+\{").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // Result
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bstruct\s+\w+").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // Avoid C# confusion
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"using\s+System").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"Console\.WriteLine\s*\(").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(public\s)?((partial|static)\s)?class\s").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\b(function|func)\s").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"let\s+\(.*,\s*.*\)\s*=").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"let\s+Point\s*\{.*,\s*.*\}\s*=").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"match\s+.*\s*\{\s*Ok\s*\(.*\)").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"#[\[derive\(.*\)\]]").unwrap()),
    r#type: Type::Macro,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"mod\s+\w+;").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"enum\s+\w+\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"pub\s+enum\s+\w+\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"fn\s+.*<'a>").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"impl\s+\w+\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"unsafe\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bSome\(").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bNone\b").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"&mut\s+\w+").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\basync\s+fn\b").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\b\.await\b").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"#[a-z_]+\!").unwrap()), // Matching macro invocations
    r#type: Type::Macro,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"trait\s+\w+").unwrap()), // Matching trait declarations
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bfor\s+\w+\s+in\s+\w+").unwrap()), // for loop iteration
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"public enum \w+\s*\{\s*([A-Z_]+\s*,\s*)*[A-Z_]+\s*\}").unwrap()
    }),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\buse\s+crate::").unwrap()), // use crate::...
    r#type: Type::MetaImport,
    near_top: None,
  },
];
