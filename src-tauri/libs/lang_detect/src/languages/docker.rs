use crate::types::{LanguagePattern, Type};
use once_cell::sync::Lazy;
use regex::Regex;

const KEYWORDS: [&str; 21] = [
  "ADD",
  "ARG",
  "AS",
  "CMD",
  "COPY",
  "CROSS_BUILD",
  "ENTRYPOINT",
  "ENV",
  "EXPOSE",
  "FROM",
  "HEALTHCHECK",
  "LABEL",
  "MAINTAINER",
  "ONBUILD",
  "RUN",
  "SHELL",
  "STOPSIGNAL",
  "USER",
  "VOLUME",
  "ENTRYPOINT",
  "WORKDIR",
];

pub static DOCKERFILE: [LanguagePattern; 1] = [LanguagePattern {
  pattern: Lazy::new(|| {
    let pattern_str = format!(r"^({})", KEYWORDS.join("|"));
    Regex::new(&pattern_str).unwrap()
  }),
  r#type: Type::Keyword,
  near_top: None,
}];
