#[cfg(target_os = "windows")]
use crate::errors::MIDError;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
use std::process::Command;
use std::process::Stdio;

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[cfg(target_os = "windows")]
pub(crate) fn get_mid_result() -> Result<String, MIDError> {
  let combined_output = Command::new("powershell")
    .args([
      "-WindowStyle",
      "Hidden",
      "-command",
      r#"
        $csproduct = Get-WmiObject Win32_ComputerSystemProduct | Select-Object -ExpandProperty UUID;
        $bios = Get-WmiObject Win32_BIOS | Select-Object -ExpandProperty SerialNumber;
        $baseboard = Get-WmiObject Win32_BaseBoard | Select-Object -ExpandProperty SerialNumber;
        $cpu = Get-WmiObject Win32_Processor | Select-Object -ExpandProperty ProcessorId;
        "$csproduct|$bios|$baseboard|$cpu"
        "#,
    ])
    .creation_flags(CREATE_NO_WINDOW)
    .stderr(Stdio::piped())
    .stdout(Stdio::piped())
    .spawn();

  match combined_output {
    Ok(output) => {
      let output = output.wait_with_output().unwrap();
      if !output.status.success() {
        return Err(MIDError::ResultMidError);
      }
      let combined_output = String::from_utf8_lossy(&output.stdout);
      if combined_output.is_empty() {
        return Err(MIDError::ResultMidError);
      }

      println!("Device ID: {}", combined_output.trim());

      Ok(
        combined_output
          .trim()
          .trim_start_matches('|')
          .trim_end_matches('|')
          .to_lowercase(),
      )
    }
    Err(_e) => Err(MIDError::ResultMidError),
  }
}
