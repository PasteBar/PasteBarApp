use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static SWIFT: [LanguagePattern; 24] = [
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"enum\s.+\s\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"struct\s.+\s\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"class\s.+\s\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"protocol\s.+\s\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"typealias\s.+\s=\s.+\s").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"import\s.+\n").unwrap()),
    r#type: Type::MetaImport,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(func\s)?([A-Za-z$_][\w$]*)\s?\(.*\) -> (.+)?\s?\{").unwrap()
    }),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(else )?if\s.+\s\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"switch\s.+\s\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"while\s.+\s\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"for\s.+\s\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(try|catch)\s\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"nil").unwrap()),
    r#type: Type::ConstantNull,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"print\s?\(.+\)").unwrap()),
    r#type: Type::KeywordPrint,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(let|var)\s.+\s(=|:)\s.+").unwrap()),
    r#type: Type::KeywordVariable,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\/\/(.+)").unwrap()),
    r#type: Type::CommentBlock,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"extension\s.+\s\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"self").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"super").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"#selector\(.+\)").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"@(IBOutlet|IBAction)\s.+\s").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"lazy\s.+\s=\s.+\s").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"inout\s.+\s").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"where\s.+\s:\s.+\s").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
];
