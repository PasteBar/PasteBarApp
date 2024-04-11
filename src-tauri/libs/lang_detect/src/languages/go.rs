use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static GO: [LanguagePattern; 22] = [
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"package\s+[a-z]+\s*(//.*)?$").unwrap()),
    r#type: Type::MetaModule,
    near_top: Some(true),
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"import\s*\(\s*(\"[a-zA-Z0-9_/]+\"\s*)+\)"#).unwrap()),
    r#type: Type::MetaImport,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"import\s+\"[a-zA-Z0-9_/]+\""#).unwrap()),
    r#type: Type::MetaImport,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"if.+err\s*!=\s*nil.+\{").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"fmt\.Print(f|ln)?\(.*\)").unwrap()),
    r#type: Type::KeywordPrint,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"func(\s+\w+\s*)?\(.*\).*\{").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\w+\s*:=\s*.+[^;\n]").unwrap()),
    r#type: Type::KeywordVariable,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(}\s*else\s*)?if[^()]+\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(var|const)\s+\w+\s+[\w*]+(\n|\s*=|$)").unwrap()),
    r#type: Type::KeywordVariable,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"[a-z]+\.[A-Z]\w*").unwrap()),
    r#type: Type::Macro,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"nil").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"struct\s+\w+\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"type\s+\w+\s+(struct|interface)").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"defer\s+.+").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"select\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"chan\s+\w+").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"go\s+func\s*\(").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"range\s+\w+").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"'.{2,}'").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"Console\.(WriteLine|Write)(\s*)?\(").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"using\sSystem(\..*)?(;)?").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(public|private|protected|internal)\s").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
];
