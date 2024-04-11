use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static JAVASCRIPT: [LanguagePattern; 38] = [
  // window. keyword
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"window\.").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // Array/Object declaration
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r#"(('|").+('|")\s*|\w+):\s*[\{\[]"#).unwrap()),
    r#type: Type::ConstantArray,
    near_top: None,
  },
  // === operator
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"===").unwrap()),
    r#type: Type::KeywordOperator,
    near_top: None,
  },
  // !== operator
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"!==").unwrap()),
    r#type: Type::KeywordOperator,
    near_top: None,
  },
  // Function definition
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"function\*?\s*([A-Za-z$_][\w$]*)?\s*[(][^:;()]*[)]\s*\{").unwrap()
    }),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // Variable declaration
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(var|const|let)\s+\w+\s*=?").unwrap()),
    r#type: Type::KeywordVariable,
    near_top: None,
  },
  // arrow function
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\(.* => \{").unwrap()),
    r#type: Type::KeywordFunction,
    near_top: None,
  },
  // console.log or error keyword
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"console\.(log|error)\s*\(").unwrap()),
    r#type: Type::KeywordPrint,
    near_top: None,
  },
  // lambda expression
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\(.*\)\s*=>\s*.+").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // (else)if statement
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(else )?if\s+\(.+\)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  // while loop
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"while\s+\(.+\)").unwrap()),
    r#type: Type::KeywordControl,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(^|\s)(char|long|int|float|double|init)\s+\w+\s*=?").unwrap()
    }),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(const)?(\s+)?val(\s+)(.*)(:(\s)(.*)(\?)?)?(\s+)=(\s+)").unwrap()
    }),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\*\w+").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r#"<(/)?script(\s+type=("|')text/javascript("|'))?>"#).unwrap()
    }),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"fn\s[A-Za-z0-9<>,]+\(.*\)\s->\s\w+(\s\{|)").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"Console\.(WriteLine|Write)(\s*)?\(").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(using\s)?System(\..*)?(;)?").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(func|fn)\s").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(begin|end)\n").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"local\s(function|(\w+)\s=)").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"fun main\((.*)?\)").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(inline(\s+))?fun(\s+)([A-Za-z0-9_])(\s+)?\((.*)\)(\s+)[{|=]").unwrap()
    }),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(const)?(\s+)?val(\s+)(.*)(:(\s)(.*)(\?)?)?(\s+)=(\s+)").unwrap()
    }),
    r#type: Type::Not,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bawait\s*\([^)]*\)\s*=>").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\basync\s+(function)?\b").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\basync\s*\([^)]*\)\s*=>").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"\bawait\b").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^(void\s)?main()\s\{").unwrap()),
    r#type: Type::Not,
    near_top: None,
  },
  // typescript
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(type|interface)\s+\w+\s+\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"<\w+(\s*,\s*\w+)*>").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"keyof\s+\w+").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"readonly\s+\w+").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"namespace\s+\w+").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"declare\s+\w+\s*=.*").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"(abstract\s+)?class\s+\w+\s+(extends\s+\w+\s+)?\{").unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"enum\s+\w+\s+\{").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(implements|extends)\s+\w+(\s*,\s*\w+)*").unwrap()),
    r#type: Type::KeywordOther,
    near_top: None,
  },
];
