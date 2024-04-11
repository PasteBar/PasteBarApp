use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static SQL: [LanguagePattern; 21] = [
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r#"DELETE FROM \w+ WHERE \w+ = ('[^']+'|"[^"]+"|\w+);"#).unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"CREATE (TABLE|DATABASE)").unwrap()),
    r#type: Type::Keyword,
    near_top: Some(true),
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"DROP (TABLE|DATABASE)").unwrap()),
    r#type: Type::Keyword,
    near_top: Some(true),
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"SHOW DATABASES").unwrap()),
    r#type: Type::Keyword,
    near_top: Some(true),
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"INSERT INTO").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(SELECT|SELECT DISTINCT)\s").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"INNER JOIN").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(GROUP|ORDER) BY").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(END;|COMMIT;)").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"UPDATE\s+\w+\sSET").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"VALUES+(\s+\(\w|\(\w)").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"VALUES \((?:[^)]+\s*,\s*)*[^)]+\)"#).unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"VALUES\s*\(").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"--\s\w").unwrap()),
    r#type: Type::CommentLine,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(VARCHAR|CHAR|BINARY|VARBINARY|BLOB|TEXT)\([0-9]+\)").unwrap()
    }),
    r#type: Type::ConstantType,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(BIT|TINYINT|SMALLINT|MEDIUMINT|INT|INTEGER|BIGINT|DOUBLE)\([0-9]+\)").unwrap()
    }),
    r#type: Type::ConstantType,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(TINYBLOB|TINYTEXT|MEDIUMTEXT|MEDIUMBLOB|LONGTEXT|LONGBLOB)").unwrap()
    }),
    r#type: Type::ConstantType,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(BOOLEAN|BOOL|DATE|YEAR)").unwrap()),
    r#type: Type::ConstantType,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(EXP|SUM|SQRT|MIN|MAX)").unwrap()),
    r#type: Type::KeywordOperator,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"local\s(function|\w+)?\s=\s").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(require|dofile)\((.*)\)").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
];
