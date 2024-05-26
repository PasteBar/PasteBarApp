#[cfg(target_os = "windows")]
use wmi::{COMLibrary, WMIConnection};

#[cfg(target_os = "windows")]
use serde::Deserialize;

#[cfg(target_os = "windows")]
use crate::errors::MIDError;

#[cfg(target_os = "windows")]
#[derive(Deserialize)]
#[allow(non_snake_case)]
struct UUIDGeneric {
  UUID: String,
}

#[cfg(target_os = "windows")]
pub fn get_mid_result() -> Result<String, MIDError> {
  let com_connection = unsafe { COMLibrary::assume_initialized() };
  let wmi_connection =
    WMIConnection::new(com_connection.into()).map_err(|_| MIDError::ResultMidError)?;

  let computer_uuid_base: Vec<UUIDGeneric> = wmi_connection
    .raw_query("SELECT UUID from Win32_ComputerSystemProduct WHERE UUID IS NOT NULL")
    .map_err(|_| MIDError::ResultMidError)?;

  if let Some(uuid_entry) = computer_uuid_base.first() {
    Ok(uuid_entry.UUID.to_string())
  } else {
    Err(MIDError::ResultMidError)
  }
}
