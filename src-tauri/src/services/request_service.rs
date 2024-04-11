use scraper::{Html, Selector};
use std::result::Result;

use jsonpath_rust::JsonPathFinder;

use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

use super::utils::ensure_url_prefix;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Header {
  name: String,
  value: String,
  is_enable: bool,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum FilterType {
  DotPathJson,
  JsonPath,
  Regex,
  RegexReplace,
  RemoveQuotes,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum RuleType {
  CSSSelector,
  RegexFind,
  RegexMatch,
  RegexMatchFoundGroup,
  RegexReplace,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum RuleReturnSeparatorType {
  Comma,
  Semicolon,
  Space,
  Newline,
  Tab,
  Pipe,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum RuleReturnPositionType {
  First,
  Last,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Filters {
  filter_type: FilterType,
  value: String,
  replace: Option<String>,
  is_enable: bool,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ScrapingRules {
  rule_type: RuleType,
  value: String,
  replace: Option<String>,
  filter_text: Option<String>,
  return_attribute: Option<String>,
  return_attribute_text: Option<String>,
  is_enable: bool,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ScrapingOptions {
  return_type: ReturnType,
  return_separator: Option<RuleReturnSeparatorType>,
  return_position: Option<RuleReturnPositionType>,
  return_count: Option<i32>,
}

#[derive(Deserialize, Debug)]
pub enum HttpMethod {
  GET,
  POST,
  PUT,
  DELETE,
  HEAD,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Content {
  pub body: String,
  pub filtered_body: Option<String>,
  pub status: u16,
  pub has_filters_error: Option<bool>,
  content_type: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentScraping {
  pub body: String,
  pub scrapped_body: Option<String>,
  pub status: u16,
  found_count: Option<i32>,
  has_rules_error: Option<bool>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Auth {
  bearer_token: Option<String>,
  basic_username: Option<String>,
  basic_password: Option<String>,
  api_key: Option<String>,
  is_enable: Option<bool>,
  api_value: Option<String>,
}

impl From<HttpMethod> for reqwest::Method {
  fn from(method: HttpMethod) -> Self {
    match method {
      HttpMethod::GET => reqwest::Method::GET,
      HttpMethod::POST => reqwest::Method::POST,
      HttpMethod::PUT => reqwest::Method::PUT,
      HttpMethod::DELETE => reqwest::Method::DELETE,
      HttpMethod::HEAD => reqwest::Method::HEAD,
    }
  }
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HttpRequest {
  url: String,
  method: HttpMethod,
  headers: Option<Vec<Header>>,
  body: Option<String>,
  auth: Option<Auth>,
  filters: Option<Vec<Filters>>,
  query_params: Option<HashMap<String, String>>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HttpScraping {
  pub url: String,
  pub method: HttpMethod,
  pub headers: Option<Vec<Header>>,
  pub scraping_options: ScrapingOptions,
  pub scraping_rules: Option<Vec<ScrapingRules>>,
}

pub async fn run_web_request(request: HttpRequest) -> Result<Content, String> {
  let client = reqwest::Client::new();

  let url_str = ensure_url_prefix(&request.url);
  let url = reqwest::Url::parse(&url_str).map_err(|e| e.to_string())?;

  let mut req_builder = client.request(request.method.into(), url);

  if let Some(headers) = request.headers {
    for header in headers {
      if header.is_enable && !header.name.is_empty() {
        req_builder = req_builder.header(header.name, header.value);
      }
    }
  }

  if let Some(auth) = request.auth {
    if auth.is_enable.is_some() {
      if let Some(token) = auth.bearer_token {
        req_builder = req_builder.bearer_auth(token);
      }
      if let (Some(username), Some(password)) = (auth.basic_username, auth.basic_password) {
        req_builder = req_builder.basic_auth(username, Some(password));
      }
      if let (Some(key), Some(value)) = (auth.api_key, auth.api_value) {
        req_builder = req_builder.header(key, value);
      }
    }
  }

  if let Some(params) = request.query_params {
    req_builder = req_builder.query(&params);
  }

  if let Some(body) = request.body {
    req_builder = req_builder.body(body);
  }

  let response = req_builder
    .send()
    .await
    .map_err(|e| format!("Request failed: {}", e))?;

  let status = response.status().as_u16();
  let content_type = response
    .headers()
    .get(reqwest::header::CONTENT_TYPE)
    .and_then(|value| value.to_str().ok())
    .unwrap_or_default()
    .to_string();
  let body = response.text().await.map_err(|e| e.to_string())?;
  let mut filtered_body = body.clone(); // Start with the original body
  let mut has_filters = false;
  let mut has_filters_error = false;

  if let Some(filters) = request.filters {
    for filter in filters {
      if filter.is_enable {
        let filter_result = match filter.filter_type {
          FilterType::DotPathJson => apply_dotpath_filter(&filtered_body, &filter.value),
          FilterType::JsonPath => apply_jsonpath_filter(&filtered_body, &filter.value),
          FilterType::Regex => apply_regex_filter(&filtered_body, &filter.value),
          FilterType::RegexReplace => {
            apply_regex_replace_filter(&filtered_body, filter.replace.as_deref(), &filter.value)
          }
          FilterType::RemoveQuotes => apply_replace_quotes(&filtered_body),
        };

        match filter_result {
          Ok(result) => {
            filtered_body = result;
            has_filters = true;
          }
          Err(err) => {
            has_filters_error = true;
            has_filters = true;
            filtered_body = err;
            break;
          }
        }
      }
    }
  }

  if has_filters_error {
    Ok(Content {
      body,
      filtered_body: Some(filtered_body),
      has_filters_error: Some(true),
      status: 500,
      content_type: "".to_string(),
    })
  } else {
    Ok(Content {
      body,
      filtered_body: if has_filters {
        Some(filtered_body)
      } else {
        None
      },
      status,
      has_filters_error: if has_filters_error { Some(true) } else { None },
      content_type,
    })
  }
}

pub async fn run_web_scraping(request: HttpScraping) -> Result<ContentScraping, String> {
  let client = reqwest::Client::new();

  let url_str = ensure_url_prefix(&request.url);
  let url = reqwest::Url::parse(&url_str).map_err(|e| e.to_string())?;

  let mut req_builder = client.request(request.method.into(), url);

  if let Some(headers) = request.headers {
    for header in headers {
      if header.is_enable && !header.name.is_empty() {
        req_builder = req_builder.header(header.name, header.value);
      }
    }
  }

  let response = req_builder
    .send()
    .await
    .map_err(|e| format!("Request failed: {}", e))?;
  let status = response.status().as_u16();
  let body = response.text().await.map_err(|e| e.to_string())?;
  let mut results: Vec<String> = Vec::new();
  let mut results_count = 0 as i32;
  let mut has_rules_error = false;

  if let Some(rules) = request.scraping_rules {
    for rule in rules {
      if rule.is_enable {
        let source = if results.is_empty() {
          vec![body.as_str()]
        } else {
          results.iter().map(|s| s.as_str()).collect::<Vec<&str>>()
        };

        let rule_result: Result<Vec<String>, String> = match rule.rule_type {
          RuleType::CSSSelector => apply_css_selector(
            &source.join(""),
            &rule.value,
            !results.is_empty(),
            rule.filter_text,
            rule.return_attribute,
            rule.return_attribute_text,
          ),
          RuleType::RegexMatchFoundGroup => {
            let regex_results = source
              .iter()
              .map(|result| apply_regex_filter_match_found(result, &rule.value))
              .collect::<Result<Vec<_>, _>>()?
              .into_iter()
              .flatten()
              .collect();
            Ok(regex_results)
          }
          RuleType::RegexMatch => {
            let regex_results = source
              .iter()
              .map(|result| apply_regex_filter_match(result, &rule.value))
              .collect::<Result<Vec<_>, _>>()?
              .into_iter()
              .flatten()
              .collect();
            Ok(regex_results)
          }
          RuleType::RegexFind => {
            let regex_results = source
              .iter()
              .map(|result| apply_regex_filter_find(result, &rule.value))
              .collect::<Result<Vec<_>, _>>()?
              .into_iter()
              .flatten()
              .collect();
            Ok(regex_results)
          }
          RuleType::RegexReplace => {
            let regex_replace_results = source
              .iter()
              .map(|result| {
                apply_regex_replace_filter_matches(result, rule.replace.as_deref(), &rule.value)
              })
              .collect::<Result<Vec<_>, _>>()?
              .into_iter()
              .flatten()
              .collect();
            Ok(regex_replace_results)
          }
        };

        match rule_result {
          Ok(new_results) => {
            results = new_results;
          }
          Err(err) => {
            has_rules_error = true;
            return Err(format!("Error occurred: {}", err));
          }
        }
      }
    }
  }

  let scrapped_body = if has_rules_error || results.is_empty() {
    "Nothing found".to_string()
  } else {
    let default_results_count = request
      .scraping_options
      .return_count
      .unwrap_or_else(|| results.len() as i32);

    let get_results_based_on_position =
      |results: &Vec<String>, position: &Option<RuleReturnPositionType>| match position {
        Some(RuleReturnPositionType::First) => results.first().cloned(),
        Some(RuleReturnPositionType::Last) => results.last().cloned(),
        _ => None,
      };

    let position = &request.scraping_options.return_position;
    let position_based_result = get_results_based_on_position(&results, position);

    match request.scraping_options.return_type {
      ReturnType::Text => {
        let separator = match request.scraping_options.return_separator {
          Some(RuleReturnSeparatorType::Comma) => ",",
          Some(RuleReturnSeparatorType::Semicolon) => ";",
          Some(RuleReturnSeparatorType::Space) => " ",
          Some(RuleReturnSeparatorType::Newline) => "\n",
          Some(RuleReturnSeparatorType::Tab) => "\t",
          Some(RuleReturnSeparatorType::Pipe) => "|",
          _ => "\n",
        };

        match position_based_result {
          Some(result) => {
            results_count = 1;
            result
          }
          None => {
            results_count = default_results_count.min(results.len() as i32);
            results
              .iter()
              .take(results_count as usize)
              .cloned()
              .collect::<Vec<_>>()
              .join(&separator)
              .trim()
              .to_string()
          }
        }
      }
      _ => {
        let limited_results = match position_based_result {
          Some(result) => vec![result],
          None => results
            .iter()
            .take(default_results_count as usize)
            .cloned()
            .collect(),
        };
        results_count = limited_results.len() as i32;
        serde_json::to_string(&limited_results)
          .map_err(|e| format!("Failed to convert result to string array: {}", e))?
      }
    }
  };

  Ok(ContentScraping {
    body: body.clone(),
    found_count: Some(results_count as i32),
    scrapped_body: Some(scrapped_body),
    status,
    has_rules_error: if has_rules_error { Some(true) } else { None },
  })
}

fn apply_dotpath_filter(input: &str, expression: &str) -> Result<String, String> {
  let result = ajson::get(input, expression)
    .map_err(|e| format!("Failed to apply Dot Path filter: {:?}", e))?
    .ok_or_else(|| "No value found at the specified path.".to_string())?;

  match result {
    ajson::Value::String(s) => Ok(s.to_string()),
    ajson::Value::Number(num) => Ok(format!("{:?}", num)),
    ajson::Value::Usize(us) => Ok(us.to_string()),
    ajson::Value::Boolean(b) => Ok(b.to_string()),
    ajson::Value::Object(json_str) | ajson::Value::Array(json_str) => {
      let parsed_json: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| format!("Failed to parse JSON for Dot Path filter: {}", e))?;

      serde_json::to_string(&parsed_json)
        .map_err(|e| format!("Failed to serialize JSON from Dot Path filter: {}", e))
    }
    ajson::Value::Null => Ok("Empty".to_string()),
  }
}

fn apply_jsonpath_filter(input: &str, expression: &str) -> Result<String, String> {
  let json_value: Value =
    serde_json::from_str(input).map_err(|e| format!("Failed to parse input as JSON: {}", e))?;

  let finder = JsonPathFinder::from_str(&json_value.to_string(), expression)
    .map_err(|e| format!("Failed to apply JSON Path filter: {}", e))?;

  let result = finder.find();
  let final_result = match result {
    Value::Null => {
      return Err("No value found at the specified path for JsonPath filter".to_string())
    }
    Value::Array(ref arr) if arr.len() == 1 => &arr[0],
    _ => &result,
  };

  serde_json::to_string(final_result)
    .map_err(|e| format!("Failed to serialize the result from JSON Path: {}", e))
}

fn apply_regex_filter(input: &str, expression: &str) -> Result<String, String> {
  let re = Regex::new(&expression).map_err(|e| format!("Failed to apply Regex filter: {}", e))?;

  let matches: Vec<String> = re
    .find_iter(input)
    .map(|mat| mat.as_str().to_string())
    .collect();

  let filtered_result = matches.join(" ");

  Ok(filtered_result)
}

fn apply_regex_filter_match(input: &str, expression: &str) -> Result<Vec<String>, String> {
  let re = Regex::new(expression).map_err(|e| format!("Failed to apply Regex filter: {}", e))?;

  let matches = re
    .find_iter(input)
    .map(|mat| mat.as_str().to_string())
    .collect();

  Ok(matches)
}

fn apply_regex_filter_match_found(input: &str, expression: &str) -> Result<Vec<String>, String> {
  let re = Regex::new(expression).map_err(|e| format!("Failed to apply Regex filter: {}", e))?;

  let matches = re
    .captures_iter(input)
    .filter_map(|cap| cap.get(1)) // Get the first capture group
    .map(|match_| match_.as_str().to_string())
    .collect();

  Ok(matches)
}

fn apply_regex_filter_find(input: &str, expression: &str) -> Result<Vec<String>, String> {
  if expression.trim().is_empty() {
    return Ok(vec![input.to_string()]);
  }

  let re = Regex::new(&expression).map_err(|e| format!("Failed to apply Regex filter: {}", e))?;

  if re.is_match(input) {
    Ok(vec![input.to_string()])
  } else {
    Ok(vec![])
  }
}

fn apply_regex_replace_filter_matches(
  input: &str,
  replace: Option<&str>,
  expression: &str,
) -> Result<Vec<String>, String> {
  if expression.trim().is_empty() {
    return Ok(vec![input.to_string()]);
  }

  let re =
    Regex::new(expression).map_err(|e| format!("Failed to apply Regex replace filter: {}", e))?;
  let replace_value = replace.unwrap_or("");

  let filtered_result = re.replace_all(input, replace_value).to_string();

  Ok(vec![filtered_result])
}

fn apply_regex_replace_filter(
  input: &str,
  replace: Option<&str>,
  expression: &str,
) -> Result<String, String> {
  let re =
    Regex::new(&expression).map_err(|e| format!("Failed to apply Regex replace filter: {}", e))?;
  let replace_value = replace.unwrap_or("");

  let filtered_result = re.replace_all(input, replace_value).to_string();

  Ok(filtered_result)
}

fn apply_replace_quotes(input: &str) -> Result<String, String> {
  let filtered_result = input.replace("\"", "");

  Ok(filtered_result)
}

#[derive(Deserialize, Debug, Clone)]
enum ReturnType {
  Text,
  Array,
}

fn apply_css_selector(
  html_content: &str,
  css_selector: &str,
  is_fragment: bool,
  filter_text: Option<String>,
  return_attribute: Option<String>,
  return_attribute_text: Option<String>,
) -> Result<Vec<String>, String> {
  let document = match is_fragment {
    true => Html::parse_fragment(html_content),
    false => Html::parse_document(html_content),
  };

  let effective_selector = if css_selector.trim().is_empty() {
    "body *"
  } else {
    css_selector
  };

  let selector = match Selector::parse(effective_selector) {
    Ok(selector) => selector,
    Err(_) => return Err("Invalid CSS selector provided".to_string()),
  };

  let results: Vec<_> = document
    .select(&selector)
    .filter_map(|element| {
      if ["script", "style", "link"].contains(&element.value().name()) {
        return None;
      }

      let text = element
        .text()
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .to_string();

      match &filter_text {
        Some(has_text_value) if !has_text_value.trim().is_empty() => {
          let text_lower = text.to_lowercase();
          let has_text_value_lower = has_text_value.to_lowercase();

          if text_lower.contains(&has_text_value_lower) {
            if let Some(_) = return_attribute
              .as_ref()
              .filter(|attr| !attr.trim().is_empty())
            {
              return_attribute_value_or_text(
                &element,
                &return_attribute,
                &return_attribute_text,
                &text,
              )
            } else {
              Some(text)
            }
          } else {
            None
          }
        }
        _ => {
          return_attribute_value_or_text(&element, &return_attribute, &return_attribute_text, &text)
        }
      }
    })
    .collect::<Vec<String>>();

  Ok(results)
}

fn return_attribute_value_or_text(
  element: &scraper::element_ref::ElementRef,
  return_attribute: &Option<String>,
  return_attribute_text: &Option<String>,
  text: &str,
) -> Option<String> {
  if let Some(attr_name) = return_attribute {
    if !attr_name.trim().is_empty() {
      if let Some(attr_value) = element.value().attr(attr_name) {
        if let Some(ref attr_text) = return_attribute_text {
          let attr_value_lower = attr_value.to_lowercase();
          let attr_text_lower = attr_text.to_lowercase();

          if attr_value_lower.contains(&attr_text_lower) {
            return Some(attr_value.to_string());
          } else {
            return None;
          }
        } else {
          return Some(attr_value.to_string());
        }
      } else {
        return None;
      }
    }
    if !text.is_empty() {
      Some(text.to_string())
    } else {
      None
    }
  } else if !text.is_empty() {
    Some(text.to_string())
  } else {
    None
  }
}
