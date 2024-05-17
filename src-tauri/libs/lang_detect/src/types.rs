use once_cell::sync::Lazy;

pub enum Type {
  CommentLine,
  CommentDocumentation,
  CommentBlock,
  MetaImport,
  MetaModule,
  SectionScope,
  ConstantType,
  ConstantString,
  ConstantNumeric,
  ConstantBoolean,
  ConstantDictionary,
  ConstantArray,
  ConstantNull,
  Keyword,
  KeywordPrint,
  KeywordVariable,
  KeywordControl,
  KeywordVisibility,
  KeywordOther,
  KeywordOperator,
  KeywordFunction,
  Macro,
  Regex,
  Not,
}

pub struct LanguagePattern {
  pub pattern: Lazy<regex::Regex>,
  pub r#type: Type,
  pub near_top: Option<bool>,
}

#[derive(Debug, Default)]
pub struct Options {
  pub heuristic: Option<bool>,
  pub no_unknown: Option<bool>,
  pub languages_to_detect: Option<Vec<String>>,
  pub prioritized_languages: Option<Vec<String>>, // Add this field
}

#[derive(Debug)]
pub struct DetectedLanguage {
  pub language: String,
  pub statistics: std::collections::HashMap<String, i32>,
  pub lines_of_code: usize,
}

pub struct LanguagePoints {
  language: String,
  points: i32,
}
