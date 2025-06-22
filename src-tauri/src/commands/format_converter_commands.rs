use csv::{Reader, Writer};
use html2text;
use pulldown_cmark::{html, Options, Parser};
use quick_xml::de::from_str as xml_from_str;
use quick_xml::se::to_string as xml_to_string;
use serde_json::{from_str as json_from_str, to_string_pretty, Value as JsonValue};
use serde_yaml::{from_str as yaml_from_str, to_string as yaml_to_string, Value as YamlValue};
use std::collections::HashMap;
use toml::{from_str as toml_from_str, to_string as toml_to_string, Value as TomlValue};
// Import html_to_react crate
extern crate html_to_react;

/// Convert CSV to JSON
fn csv_to_json(text: &str) -> Result<String, String> {
  if !text.contains(',') && !text.contains('\t') && !text.contains(';') {
    return Err("Input does not appear to be valid CSV format (no delimiters found)".to_string());
  }

  let mut reader = Reader::from_reader(text.as_bytes());
  let mut records = Vec::new();

  // Get headers
  let headers = reader
    .headers()
    .map_err(|e| {
      format!(
        "Failed to read CSV headers - ensure the text is properly formatted CSV: {}",
        e
      )
    })?
    .clone();

  if headers.is_empty() {
    return Err("CSV file appears to have no headers".to_string());
  }

  // Read all records
  for result in reader.records() {
    let record = result.map_err(|e| format!("Failed to read CSV record: {}", e))?;
    let mut map = HashMap::new();

    for (i, field) in record.iter().enumerate() {
      if let Some(header) = headers.get(i) {
        map.insert(header.to_string(), field.to_string());
      }
    }
    records.push(map);
  }

  to_string_pretty(&records).map_err(|e| format!("Failed to serialize to JSON: {}", e))
}

/// Convert JSON to CSV
fn json_to_csv(text: &str) -> Result<String, String> {
  let json_data: JsonValue =
    json_from_str(text).map_err(|e| format!("Invalid JSON format: {}", e))?;

  let mut output = Vec::new();
  {
    let mut writer = Writer::from_writer(&mut output);

    match json_data {
      JsonValue::Array(ref array) => {
        if array.is_empty() {
          return Ok(String::new());
        }

        // Extract headers from first object
        if let Some(JsonValue::Object(first_obj)) = array.first() {
          let headers: Vec<String> = first_obj.keys().cloned().collect();
          writer
            .write_record(&headers)
            .map_err(|e| format!("Failed to write CSV headers: {}", e))?;

          // Write data rows
          for item in array {
            if let JsonValue::Object(obj) = item {
              let row: Vec<String> = headers
                .iter()
                .map(|header| {
                  obj
                    .get(header)
                    .map(|v| match v {
                      JsonValue::String(s) => s.clone(),
                      JsonValue::Number(n) => n.to_string(),
                      JsonValue::Bool(b) => b.to_string(),
                      JsonValue::Null => String::new(),
                      _ => v.to_string(),
                    })
                    .unwrap_or_default()
                })
                .collect();
              writer
                .write_record(&row)
                .map_err(|e| format!("Failed to write CSV row: {}", e))?;
            }
          }
        }
      }
      _ => return Err("JSON must be an array of objects for CSV conversion".to_string()),
    }

    writer
      .flush()
      .map_err(|e| format!("Failed to flush CSV writer: {}", e))?;
  } // writer is dropped here, releasing the borrow

  String::from_utf8(output).map_err(|e| format!("Failed to convert CSV to string: {}", e))
}

/// Convert YAML to JSON
fn yaml_to_json(text: &str) -> Result<String, String> {
  let yaml_data: YamlValue = yaml_from_str(text).map_err(|e| format!("Invalid YAML: {}", e))?;

  to_string_pretty(&yaml_data).map_err(|e| format!("Failed to serialize to JSON: {}", e))
}

/// Convert JSON to YAML
fn json_to_yaml(text: &str) -> Result<String, String> {
  let json_data: JsonValue = json_from_str(text).map_err(|e| format!("Invalid JSON: {}", e))?;

  yaml_to_string(&json_data).map_err(|e| format!("Failed to serialize to YAML: {}", e))
}

/// Convert Markdown to HTML
fn markdown_to_html(text: &str) -> Result<String, String> {
  let mut options = Options::empty();
  options.insert(Options::ENABLE_STRIKETHROUGH);
  options.insert(Options::ENABLE_TABLES);
  options.insert(Options::ENABLE_FOOTNOTES);
  options.insert(Options::ENABLE_TASKLISTS);

  let parser = Parser::new_ext(text, options);
  let mut html_output = String::new();
  html::push_html(&mut html_output, parser);
  Ok(html_output)
}

/// Convert HTML to Markdown
fn html_to_markdown(text: &str) -> Result<String, String> {
  // Use html2md for better HTML to Markdown conversion
  Ok(html2md::parse_html(text))
}

/// Convert HTML to plain text
fn html_to_text(text: &str) -> Result<String, String> {
  Ok(html2text::from_read(text.as_bytes(), text.len()))
}

/// Convert Markdown to plain text
fn markdown_to_text(text: &str) -> Result<String, String> {
  // First convert markdown to HTML, then HTML to text
  let html = markdown_to_html(text)?;
  html_to_text(&html)
}

// Convert HTML to React Component (JSX)
fn html_to_react_components(text: &str) -> Result<String, String> {
  // Use html_to_react crate to convert HTML to React JSX
  let component = html_to_react::convert_to_react(text.to_string(), "MyComponent".to_string());
  Ok(component)
}

/// Convert HTML to React JSX with comprehensive HTML to JSX conversion
fn convert_html_to_react_jsx(text: &str) -> Result<String, String> {
  // Comprehensive HTML to JSX converter with support for:
  // - HTML attributes to JSX attributes (class -> className, for -> htmlFor, etc.)
  // - Self-closing tags
  // - HTML comments to JSX comments
  // - Boolean attributes
  // - CSS style properties to camelCase
  let jsx = html_to_react::convert_props_react(text.to_string());

  Ok(jsx)
}

/// Convert XML to JSON
fn xml_to_json(text: &str) -> Result<String, String> {
  let xml_data: JsonValue = xml_from_str(text).map_err(|e| format!("Invalid XML: {}", e))?;

  to_string_pretty(&xml_data).map_err(|e| format!("Failed to serialize to JSON: {}", e))
}

/// Convert JSON to XML
fn json_to_xml(text: &str) -> Result<String, String> {
  let json_data: JsonValue = json_from_str(text).map_err(|e| format!("Invalid JSON: {}", e))?;

  xml_to_string(&json_data).map_err(|e| format!("Failed to serialize to XML: {}", e))
}

/// Convert TOML to JSON
fn toml_to_json(text: &str) -> Result<String, String> {
  let toml_data: TomlValue = toml_from_str(text).map_err(|e| format!("Invalid TOML: {}", e))?;

  to_string_pretty(&toml_data).map_err(|e| format!("Failed to serialize to JSON: {}", e))
}

/// Convert JSON to TOML
fn json_to_toml(text: &str) -> Result<String, String> {
  let json_data: JsonValue = json_from_str(text).map_err(|e| format!("Invalid JSON: {}", e))?;

  // Convert JsonValue to TomlValue
  let toml_data = json_to_toml_value(json_data)?;
  toml_to_string(&toml_data).map_err(|e| format!("Failed to serialize to TOML: {}", e))
}

/// Helper to convert JsonValue to TomlValue
fn json_to_toml_value(json: JsonValue) -> Result<TomlValue, String> {
  match json {
    JsonValue::Null => Ok(TomlValue::String("".to_string())),
    JsonValue::Bool(b) => Ok(TomlValue::Boolean(b)),
    JsonValue::Number(n) => {
      if let Some(i) = n.as_i64() {
        Ok(TomlValue::Integer(i))
      } else if let Some(f) = n.as_f64() {
        Ok(TomlValue::Float(f))
      } else {
        Err("Invalid number format".to_string())
      }
    }
    JsonValue::String(s) => Ok(TomlValue::String(s)),
    JsonValue::Array(arr) => {
      let mut toml_array = Vec::new();
      for item in arr {
        toml_array.push(json_to_toml_value(item)?);
      }
      Ok(TomlValue::Array(toml_array))
    }
    JsonValue::Object(obj) => {
      let mut toml_table = toml::value::Table::new();
      for (key, value) in obj {
        toml_table.insert(key, json_to_toml_value(value)?);
      }
      Ok(TomlValue::Table(toml_table))
    }
  }
}

/// Convert CSV to Markdown table
fn csv_to_table(text: &str) -> Result<String, String> {
  let mut reader = Reader::from_reader(text.as_bytes());
  let mut markdown = String::new();

  // Get headers
  let headers = reader
    .headers()
    .map_err(|e| format!("Failed to read CSV headers: {}", e))?;

  // Write header row
  markdown.push('|');
  for header in headers.iter() {
    markdown.push(' ');
    markdown.push_str(header);
    markdown.push_str(" |");
  }
  markdown.push('\n');

  // Write separator row
  markdown.push('|');
  for _ in headers.iter() {
    markdown.push_str(" --- |");
  }
  markdown.push('\n');

  // Write data rows
  for result in reader.records() {
    let record = result.map_err(|e| format!("Failed to read CSV record: {}", e))?;
    markdown.push('|');
    for field in record.iter() {
      markdown.push(' ');
      markdown.push_str(field);
      markdown.push_str(" |");
    }
    markdown.push('\n');
  }

  Ok(markdown)
}

/// Convert JSON to Markdown table
fn json_to_table(text: &str) -> Result<String, String> {
  let json_data: JsonValue = json_from_str(text).map_err(|e| format!("Invalid JSON: {}", e))?;

  match json_data {
    JsonValue::Array(ref array) => {
      if array.is_empty() {
        return Ok(String::new());
      }

      let mut markdown = String::new();

      // Extract headers from first object
      if let Some(JsonValue::Object(first_obj)) = array.first() {
        let headers: Vec<String> = first_obj.keys().cloned().collect();

        // Write header row
        markdown.push('|');
        for header in &headers {
          markdown.push(' ');
          markdown.push_str(header);
          markdown.push_str(" |");
        }
        markdown.push('\n');

        // Write separator row
        markdown.push('|');
        for _ in &headers {
          markdown.push_str(" --- |");
        }
        markdown.push('\n');

        // Write data rows
        for item in array {
          if let JsonValue::Object(obj) = item {
            markdown.push('|');
            for header in &headers {
              markdown.push(' ');
              if let Some(value) = obj.get(header) {
                let cell_value = match value {
                  JsonValue::String(s) => s.clone(),
                  JsonValue::Number(n) => n.to_string(),
                  JsonValue::Bool(b) => b.to_string(),
                  JsonValue::Null => String::new(),
                  _ => value.to_string(),
                };
                markdown.push_str(&cell_value);
              }
              markdown.push_str(" |");
            }
            markdown.push('\n');
          }
        }
      }

      Ok(markdown)
    }
    _ => Err("JSON must be an array of objects for table conversion".to_string()),
  }
}

/// Main format converter command
#[tauri::command]
pub async fn format_convert(text: String, conversion_type: String) -> Result<String, String> {
  // Validate input
  if text.trim().is_empty() {
    return Err("Input text cannot be empty".to_string());
  }

  // Log the conversion attempt for debugging
  eprintln!(
    "Converting {} with type: {}",
    text.chars().take(50).collect::<String>(),
    conversion_type
  );

  match conversion_type.as_str() {
    "csv_to_json" => csv_to_json(&text).map_err(|e| format!("CSV to JSON conversion failed: {}", e)),
    "json_to_csv" => json_to_csv(&text).map_err(|e| format!("JSON to CSV conversion failed: {}", e)),
    "yaml_to_json" => yaml_to_json(&text).map_err(|e| format!("YAML to JSON conversion failed: {}", e)),
    "json_to_yaml" => json_to_yaml(&text).map_err(|e| format!("JSON to YAML conversion failed: {}", e)),
    "markdown_to_html" => markdown_to_html(&text).map_err(|e| format!("Markdown to HTML conversion failed: {}", e)),
    "html_to_markdown" => html_to_markdown(&text).map_err(|e| format!("HTML to Markdown conversion failed: {}", e)),
    "html_to_react_components" => html_to_react_components(&text).map_err(|e| format!("HTML to React Component conversion failed: {}", e)),
    "html_to_text" => html_to_text(&text).map_err(|e| format!("HTML to Text conversion failed: {}", e)),
    "markdown_to_text" => markdown_to_text(&text).map_err(|e| format!("Markdown to Text conversion failed: {}", e)),
    "html_to_react" => convert_html_to_react_jsx(&text).map_err(|e| format!("HTML to React JSX conversion failed: {}", e)),
    "xml_to_json" => xml_to_json(&text).map_err(|e| format!("XML to JSON conversion failed: {}", e)),
    "json_to_xml" => json_to_xml(&text).map_err(|e| format!("JSON to XML conversion failed: {}", e)),
    "toml_to_json" => toml_to_json(&text).map_err(|e| format!("TOML to JSON conversion failed: {}", e)),
    "json_to_toml" => json_to_toml(&text).map_err(|e| format!("JSON to TOML conversion failed: {}", e)),
    "csv_to_table" => csv_to_table(&text).map_err(|e| format!("CSV to Table conversion failed: {}", e)),
    "json_to_table" => json_to_table(&text).map_err(|e| format!("JSON to Table conversion failed: {}", e)),
    _ => Err(format!("Unsupported conversion type: '{}'. Available types: csv_to_json, json_to_csv, yaml_to_json, json_to_yaml, markdown_to_html, html_to_markdown, html_to_text, markdown_to_text, html_to_react, xml_to_json, json_to_xml, toml_to_json, json_to_toml, csv_to_table, json_to_table", conversion_type)),
  }
}
