#[cfg(target_os = "macos")]
use crate::errors::MIDError;

#[cfg(target_os = "macos")]
use std::process::{Command, Stdio};

#[cfg(target_os = "macos")]
pub(crate) fn get_mid_result() -> Result<String, MIDError> {
  let output = Command::new("sh")
    .arg("-c")
    .arg("system_profiler SPHardwareDataType | awk '/Hardware UUID/ { print $3; }'")
    .stderr(Stdio::piped())
    .stdout(Stdio::piped())
    .output()
    .map_err(|_| MIDError::ResultMidError)?;

  if !output.status.success() {
    return Err(MIDError::ResultMidError);
  }

  let uuid = String::from_utf8_lossy(&output.stdout).trim().to_string();
  if uuid.is_empty() {
    return Err(MIDError::ResultMidError);
  }

  Ok(uuid)
}
