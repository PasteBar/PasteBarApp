use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static JAVA: [LanguagePattern; 30] = [
  // Java-specific patterns
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"public\s+class\s+\w+\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"public\s+static\s+void\s+main\s*\(\s*String\[\]\s+\w+\s*\)\s*\{").unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"public enum \w+\s*\{\s*([A-Z_]+\s*,\s*)*[A-Z_]+\s*\}").unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"System\.(in|out)\.\w+").unwrap()),
    r#type: Type::KeywordPrint,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(private|protected|public)\s+\w+\s*\w+\s*\(.*\)\s*\{").unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(private|protected|public)\s+\w+\s+\w+(\s*=\s*\w+)?\s*;").unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(^|\s)String\s+\w+\s*=?").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(List<\w+>|ArrayList<\w+>\s*\(.*\))(\s+\w+|;)").unwrap()),
    r#type: Type::KeywordVariable,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(^|\s)(char|long|int|float|double)\s+\w+\s*=?").unwrap()),
    r#type: Type::ConstantType,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\w+\.(get|set)\(.+\)").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"new [A-Z]\w*\s*\(.*\)").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(extends|implements)").unwrap()),
    r#type: Type::MetaModule,
    near_top: Some(true),
  },
  // General patterns (less specific)
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(public\s*)?class\b.*?\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"final\s*\w+").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"null").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(else )?if\s*\(.*\)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"while\s*\(.*\)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"void").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"public\s+enum\s+\w+\s*\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Patterns to exclude (Type::Not)
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"'.{2,}'").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"^#include\s*(<|")\w+(\.h)?(>|")"#).unwrap()),
    r#type: Type::Not,
    near_top: Some(true),
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"def\s+\w+\s*(\(.+\))?\s*\n").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bnamespace\s.*(\s\{)?").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\[Attribute\]").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"Console\.(WriteLine|Write)(\s*)?\(").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(#region(\s.*)?|#endregion\n)").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"using\sSystem(\..*)?(;)?").unwrap()),
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
      Regex::new(r"(inline(\s+))?fun(\s+)([A-Za-z0-9_])(\s+)?\((.*)\)(\s+)(\{|:)?").unwrap()
    }),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"pub\s+enum\s+\w+\s*\{").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
];
