use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static MARKDOWN: [LanguagePattern; 14] = [
  // 1. Headings (from # to ######)
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^(#{1,6})\s.+").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // 2. Headings alternate syntax (with = or -)
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^[\=-]{2,}$").unwrap()),
    r#type: Type::Keyword,
    near_top: Some(true),
  },
  // 3. Images
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"!\[.*\]\(.*\)").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // 4. Inline links
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^\[[^\[\]]+\]\([^\[\]]+\)$").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // 5. Reference links (definition)
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^(\s|)\[.+\]:\s?.*(\s|$)").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // 6. Reference links (usage)
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^\[.*\]\[.*\]$").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  // 7. Blockquotes
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^> .+").unwrap()),
    r#type: Type::Macro,
    near_top: None,
  },
  // 8. Code blocks (fenced)
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^```.*$").unwrap()),
    r#type: Type::Keyword,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"~~[^~]+~~").unwrap()),
    r#type: Type::MetaModule,
    near_top: None,
  },
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^\s*(---|\*\*\*|___)\s*$").unwrap()),
    r#type: Type::MetaModule,
    near_top: None,
  },
  // 9. Frontmatter
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^---$").unwrap()),
    r#type: Type::MetaModule,
    near_top: Some(true),
  },
  // 10. Bold and Italic (alternate syntax)
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"(\b\*|\b_)[^\*]+(\*\b|_\b)").unwrap()),
    r#type: Type::MetaModule,
    near_top: None,
  },
  // 12. Unordered Lists
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^(\s*)(\*|\+|-) [^\s].*").unwrap()),
    r#type: Type::MetaModule,
    near_top: None,
  },
  // 13 Ordered Lists
  LanguagePattern {
    pattern: Lazy::new(|| Regex::new(r"^\d+\.\s.+").unwrap()),
    r#type: Type::MetaModule,
    near_top: None,
  },
];
