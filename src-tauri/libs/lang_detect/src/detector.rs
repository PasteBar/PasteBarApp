use crate::points::{get_points, near_top};
use crate::shebang::SHEBANG_MAP;
use crate::types::{DetectedLanguage, LanguagePattern, Options};
use std::collections::HashMap;

static LANGUAGES: &[(&str, &[LanguagePattern])] = &[
  ("c", &crate::languages::c::C),
  ("cpp", &crate::languages::cpp::CPP),
  ("csharp", &crate::languages::cs::CS),
  ("css", &crate::languages::css::CSS),
  ("docker", &crate::languages::docker::DOCKERFILE),
  ("go", &crate::languages::go::GO),
  ("html", &crate::languages::html::HTML),
  ("java", &crate::languages::java::JAVA),
  ("javascript", &crate::languages::javascript::JAVASCRIPT),
  ("jsx", &crate::languages::jsx::JSX),
  ("json", &crate::languages::json::JSON),
  ("kotlin", &crate::languages::kotlin::KOTLIN),
  ("markdown", &crate::languages::markdown::MARKDOWN),
  ("php", &crate::languages::php::PHP),
  ("python", &crate::languages::python::PYTHON),
  ("regex", &crate::languages::regex::REGEX),
  ("ruby", &crate::languages::ruby::RUBY),
  ("rust", &crate::languages::rust::RUST),
  ("shell", &crate::languages::shell::SHELL),
  ("sql", &crate::languages::sql::SQL),
  ("swift", &crate::languages::swift::SWIFT),
  ("yaml", &crate::languages::yaml::YAML),
];


#[derive(Debug, Clone, Copy)]
enum Detected {
  Known(&'static str, i32),
  Unknown,
}

impl Detected {
  fn new(language: &'static str, points: i32) -> Self {
    Detected::Known(language, points)
  }
}

impl DetectedLanguage {
  fn from_detected(detected: Detected) -> Self {
    let language = match detected {
      Detected::Known(lang, _) => lang.to_string(),
      Detected::Unknown => "Unknown".to_string(),
    };

    let mut statistics = HashMap::new();
    if let Detected::Known(lang, points) = detected {
      statistics.insert(lang.to_string(), points);
    }

    DetectedLanguage {
      language,
      statistics,
      lines_of_code: 0,
    }
  }
}

pub fn detect_language(snippet: &str, opts: Option<Options>) -> DetectedLanguage {
  let options = opts.unwrap_or_default();

  let replaced_snippet = snippet.replace("\r\n", "\n").replace("\n\n", "\n");
  let lines_of_code: Vec<&str> = replaced_snippet.split('\n').collect();

  let filtered_lines_of_code = if options.heuristic.unwrap_or(true) && lines_of_code.len() > 100 {
    lines_of_code
      .iter()
      .filter(|&&line| near_top(line, &lines_of_code))
      .cloned()
      .collect()
  } else {
    lines_of_code
  };

  // Shebang check
  let detected_shebang = if let Some(first_line) = filtered_lines_of_code.first() {
    if first_line.starts_with("#!") {
      if let Some(language) = SHEBANG_MAP.get(first_line.split_whitespace().nth(2).unwrap_or("")) {
        Some(Detected::new(language, 1))
      } else if first_line.starts_with("#!/bin/bash") {
        Some(Detected::new("bash", 1))
      } else {
        None
      }
    } else {
      None
    }
  } else {
    None
  };

  if let Some(detected) = detected_shebang {
    return DetectedLanguage::from_detected(detected);
  }

  if filtered_lines_of_code
    .iter()
    .all(|line| line.trim().is_empty())
  {
    return DetectedLanguage::from_detected(Detected::Unknown);
  }

  // Filter LANGUAGES based on provided list of languages in options
  let filtered_languages: Vec<_> = LANGUAGES
    .iter()
    .filter(|&&(language, _)| {
      if let Some(languages_to_detect) = &options.languages_to_detect {
        languages_to_detect.contains(&language.to_string())
      } else {
        true
      }
    })
    .collect();

  let mut results: Vec<Detected> = Vec::new();
  for &(language, checkers) in filtered_languages.iter() {
    let mut points = 0;
    for line in &filtered_lines_of_code {
      if !line.trim().is_empty() {
        points += get_points(line, checkers);
      }
    }
    results.push(Detected::new(language, points));
  }

  if !options.no_unknown.unwrap_or(false) {
    results.push(Detected::Unknown);
  }

  let best_result = results.iter().max_by_key(|&detected| {
    if let Detected::Known(_, points) = detected {
      *points
    } else {
      0
    }
  });

  if let Some(&detected) = best_result {
    DetectedLanguage::from_detected(detected)
  } else {
    DetectedLanguage::from_detected(Detected::Unknown)
  }
}
