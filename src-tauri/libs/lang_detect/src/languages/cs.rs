use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static CS: [LanguagePattern; 32] = [
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"using\sSystem(\..*)?(;)?").unwrap()),
    r#type: Type::MetaImport,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"Console\.(WriteLine|Write)(\s*)?\(").unwrap()),
    r#type: Type::KeywordPrint,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"Console\.ReadLine\(\)").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(public\s)?((partial|static|delegate)\s)?class\s").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(extern|override|sealed|readonly|virtual|volatile)").unwrap()
    }),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"namespace\s(.*)(\.(.*))?(\s\{)?").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(#region(\s.*)?|#endregion\n)").unwrap()),
    r#type: Type::SectionScope,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(public|private|protected|internal)\s").unwrap()),
    r#type: Type::KeywordVisibility,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bclass\s+\w+").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(else )?if\s*\(.+\)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bwhile\s+\(.+\)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(const\s)?(sbyte|byte|short|ushort|int|uint|long|ulong|float|double|decimal|bool|char|string)(\[\])?\s(.*)\s=\s(.*);").unwrap()
    }),
    r#type: Type::ConstantType,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(new|this\s)?(List|IEnumerable)<(sbyte|byte|short|ushort|int|uint|long|ulong|float|double|decimal|bool|char|string)>").unwrap()
    }),
    r#type: Type::ConstantDictionary,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"#define\s(.*)").unwrap()),
    r#type: Type::Macro,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(
        r"\s([A-Z]([A-Z0-9]*[a-z][a-z0-9]*[A-Z]|[a-z0-9]*[A-Z][A-Z0-9]*[a-z])[A-Za-z0-9]*)\s=",
      )
      .unwrap()
    }),
    r#type: Type::Macro,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(extends|throws|@Attribute)").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"System\.(in|out)\.\w+").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bmodule\s\S").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"^\s*import\s(\"|')dart:\w+(\"|')"#).unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"return\s.+\s?;").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\btry\s\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"catch\s?\(.+\)\s\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"finally\s\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bthrow\s.+\s?;").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"delegate\s.+\s?;").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"event\s.+\s?;").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bfor\s?\(.+\)\s\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bforeach\s?\(.+\)\s\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\block\s?\(.+\)\s\{").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bgoto\s.+\s?;").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(interface|struct|enum)\s.+\s\{|unsafe\s\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\b(sizeof|typeof|bbase)\s?\(.+\)").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
];
