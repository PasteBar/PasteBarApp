use crate::types::{LanguagePattern, Type};

pub fn get_points(line_of_code: &str, checkers: &[LanguagePattern]) -> i32 {
  checkers.iter().fold(0, |acc, checker| {
    if checker.pattern.is_match(line_of_code) {
      acc + parse_point(&checker.r#type)
    } else {
      acc
    }
  })
}

fn parse_point(r#type: &Type) -> i32 {
  match r#type {
    Type::KeywordPrint | Type::MetaImport | Type::MetaModule => 5,
    Type::KeywordFunction | Type::ConstantNull => 4,
    Type::ConstantType
    | Type::ConstantString
    | Type::ConstantNumeric
    | Type::ConstantBoolean
    | Type::ConstantDictionary
    | Type::ConstantArray
    | Type::KeywordVariable => 3,
    Type::SectionScope
    | Type::KeywordOther
    | Type::KeywordOperator
    | Type::KeywordControl
    | Type::KeywordVisibility
    | Type::Regex
    | Type::Keyword => 2,
    Type::CommentBlock | Type::CommentLine | Type::CommentDocumentation | Type::Macro => 1,
    Type::Not => -20,
  }
}

pub fn near_top(line: &str, lines_of_code: &[&str]) -> bool {
  if lines_of_code.len() <= 10 {
    true
  } else {
    lines_of_code.iter().position(|&l| l == line).unwrap() < lines_of_code.len() / 10
  }
}
