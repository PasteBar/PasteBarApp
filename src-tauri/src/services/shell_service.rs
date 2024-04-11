use dirs;
use is_executable::IsExecutable;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OutputTemplate {
  pub value: String,
  pub is_enable: bool,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]

pub struct OutputRegexFilter {
  pub value: String,
  pub is_enable: bool,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]

pub struct ExecHomeDir {
  pub value: String,
  pub is_enable: bool,
}

pub fn run_shell_command(
  exec_cmd: &str,
  exec_home_dir: Option<ExecHomeDir>,
  output_template: Option<OutputTemplate>,
  output_regex_filter: Option<OutputRegexFilter>,
) -> Result<String, String> {
  let current_dir = match exec_home_dir {
    Some(dir) if dir.is_enable => PathBuf::from(dir.value),
    _ => dirs::home_dir().unwrap_or_else(|| {
      PathBuf::from(if cfg!(target_os = "windows") {
        "%USERPROFILE%"
      } else {
        "/"
      })
    }),
  };

  let output = if cfg!(target_os = "windows") {
    Command::new("cmd")
      .current_dir(&current_dir)
      .args(["/C", exec_cmd])
      .output()
  } else {
    Command::new("sh")
      .current_dir(&current_dir)
      .arg("-c")
      .arg(exec_cmd)
      .output()
  };

  match output {
    Ok(output) => {
      let mut stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
      let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

      if !stderr.is_empty() {
        Err(format!("Error: {}\n{}", stderr, stdout))
      } else {
        if let Some(output_regex_filter) = output_regex_filter {
          if output_regex_filter.is_enable && !output_regex_filter.value.is_empty() {
            let re = regex::Regex::new(&output_regex_filter.value)
              .map_err(|e| format!("Failed to apply Regex filter: {}", e))?;

            let matches: Vec<String> = re
              .captures_iter(&stdout)
              .filter_map(|cap| cap.get(1))
              .map(|mat| mat.as_str().to_string())
              .collect();

            if !matches.is_empty() {
              stdout = matches.join(" ").trim().to_string();
            }
          }
        }

        match output_template {
          Some(template) if template.is_enable && template.value.contains("{{output}}") => {
            Ok(template.value.replace("{{output}}", &stdout))
          }
          _ => Ok(stdout),
        }
      }
    }
    Err(e) => Err(format!("Failed to execute command: {}", e)),
  }
}

pub fn check_path(path: &str) -> Result<String, String> {
  let path_check = Path::new(&path);

  if path_check.exists() {
    if path_check.is_file() {
      Ok("File".to_string())
    } else if path_check.is_dir() {
      Ok("Folder".to_string())
    } else {
      Ok("Other".to_string())
    }
  } else {
    Err("Path does not exist".to_string())
  }
}

pub fn path_type_check(path: &str) -> Result<String, String> {
  let path_check = Path::new(path);

  if !path_check.exists() {
    return Err("Path does not exist".to_string());
  }

  if path_check.is_executable() {
    if let Some(ext) = path_check.extension().and_then(|e| e.to_str()) {
      if ext.eq_ignore_ascii_case("sh")
        || ext.eq_ignore_ascii_case("command")
        || ext.eq_ignore_ascii_case("cmd")
        || ext.eq_ignore_ascii_case("bat")
      {
        return Ok("Executable script".to_string());
      }
    }

    return Ok("Executable".to_string());
  }

  if path_check.is_file() {
    if let Some(ext) = path_check.extension().and_then(|e| e.to_str()) {
      if ext.eq_ignore_ascii_case("sh")
        || ext.eq_ignore_ascii_case("command")
        || ext.eq_ignore_ascii_case("cmd")
        || ext.eq_ignore_ascii_case("bat")
      {
        return Ok("Script".to_string());
      }
    }

    #[cfg(windows)]
    {
      if let Some(ext) = path_check.extension().and_then(|e| e.to_str()) {
        if ext.eq_ignore_ascii_case("exe") {
          return Ok("App".to_string());
        }
      }
    }

    if let Some(ext) = path_check.extension().and_then(|e| e.to_str()) {
      if ext.eq_ignore_ascii_case("lnk") || ext.eq_ignore_ascii_case("pvm") {
        return Ok("Parallels".to_string());
      }
      if ext.eq_ignore_ascii_case("vbox") || ext.eq_ignore_ascii_case("vdi") {
        return Ok("VirtualBox".to_string());
      }
    }

    Ok("File".to_string())
  } else if path_check.is_dir() {
    #[cfg(target_os = "macos")]
    {
      if let Some(ext) = path_check.extension().and_then(|e| e.to_str()) {
        if ext.eq_ignore_ascii_case("app") {
          return Ok("App".to_string());
        }
      }
    }

    Ok("Folder".to_string())
  } else {
    Ok("Other".to_string())
  }
}
