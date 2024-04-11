use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static PHP: [LanguagePattern; 22] = [
  // PHP tag
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"<\?php").unwrap()),
    r#type: Type::MetaModule,
    near_top: None,
  },
  // PHP style variables.
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\$\w+").unwrap()),
    r#type: Type::KeywordVariable,
    near_top: None,
  },
  // use Something\Something;
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"use\s+\w+(\\\w+)+\s*;").unwrap()),
    r#type: Type::MetaImport,
    near_top: Some(true),
  },
  // arrow
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\$\w+->\w+").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // require/include
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r#"(require|include)(_once)?\s*\(?\s*('|").+\.php('|")\s*\)?\s*;"#).unwrap()
    }),
    r#type: Type::MetaImport,
    near_top: None,
  },
  // echo 'something';
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"echo\s+('|").+('|")\s*;"#).unwrap()),
    r#type: Type::KeywordPrint,
    near_top: None,
  },
  // NULL constant
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"NULL").unwrap()),
    r#type: Type::ConstantNull,
    near_top: None,
  },
  // new keyword
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"new\s+((\\\w+)+|\w+)(\(.*\))?").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Function definition
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"function(\s+[$\w]+\(.*\)|\s*\(.*\))").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // (else)if statement
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(else)?if\s+\(.+\)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // scope operator
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\w+::\w+").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // slef:: parent:: static::
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(self|parent|static)::").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"public\s+function\s+__\w+\(").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Namespaces
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"namespace\s+\w+(\\\w+)*;").unwrap()),
    r#type: Type::MetaModule,
    near_top: Some(true),
  },
  // === operator
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"===").unwrap()),
    r#type: Type::KeywordOperator,
    near_top: None,
  },
  // interfaces and traits:
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"interface\s+\w+\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"trait\s+\w+\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // class declarations
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"class\s+\w+(\s+extends\s+\w+)?(\s+implements\s+\w+(,\s*\w+)*)?\s*\{").unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  // !== operator
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"!==").unwrap()),
    r#type: Type::KeywordOperator,
    near_top: None,
  },
  // C/JS style variable declaration.
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(^|\s)(var|char|long|int|float|double)\s+\w+\s*=?").unwrap()
    }),
    r#type: Type::Not,
    near_top: None,
  },
  // Javascript variable declaration
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(var|const|let)\s+\w+\s*=?").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  // Avoiding Lua confusion
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"local\s(function|\w+)").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
];
