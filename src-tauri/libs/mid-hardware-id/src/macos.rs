#[cfg(target_os = "macos")]
use crate::errors::MIDError;

#[cfg(target_os = "macos")]
use std::process::{Command, Stdio};

#[cfg(target_os = "macos")]
pub(crate) fn get_mid_result() -> Result<String, MIDError> {
  let combined_output = Command::new("sh")
    .arg("-c")
    .arg(r#"system_profiler SPHardwareDataType SPSecureElementDataType"#)
    .stderr(Stdio::piped())
    .stdout(Stdio::piped())
    .spawn();

  match combined_output {
    Ok(output) => {
      let output = output.wait_with_output().unwrap();
      if !output.status.success() {
        return Err(MIDError::ResultMidError);
      }
      let system_profiler_output = String::from_utf8_lossy(&output.stdout);
      if system_profiler_output.is_empty() {
        return Err(MIDError::ResultMidError);
      }

      let targets = [
        "Model Number",
        "Serial Number",
        "Hardware UUID",
        "Provisioning UDID",
        "Platform ID",
        "SEID",
      ];

      let combined_string = process_output(&system_profiler_output, &targets);

      if combined_string.is_empty() {
        return Err(MIDError::ResultMidError);
      }

      Ok(combined_string)
    }
    Err(_e) => Err(MIDError::ResultMidError),
  }
}

#[cfg(target_os = "macos")]
fn process_output(output_str: &str, targets: &[&str]) -> String {
  let mut result = Vec::new();

  for target in targets {
    for line in output_str.to_lowercase().lines() {
      if line.contains(&target.to_lowercase()) {
        let parts: Vec<&str> = line.split(":").collect();

        if parts.len() == 2 {
          let value = parts[1].trim().to_string();

          if !value.is_empty() {
            result.push(value);
          }
        }
      }
    }
  }

  result.join("|")
}
