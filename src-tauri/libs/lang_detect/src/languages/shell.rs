use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

pub static SHELL: [LanguagePattern; 1] = [
  // Detect shell command or package
  LanguagePattern {
    pattern: Lazy::new(|| {
      Regex::new(r"^(#|\$|%|>|PS1>|PS2>|~\$|~#|~%|~>)\s*(cp|rm|npm|yarn|pnpm|cargo|node|git|echo|mkdir|mv|cd|ls|pwd|chmod|chown|sudo|grep|awk|sed|curl|wget|tar|zip|unzip|ssh|scp|rsync)\b").unwrap()
    }),
    r#type: Type::Keyword,
    near_top: None,
  },
];
