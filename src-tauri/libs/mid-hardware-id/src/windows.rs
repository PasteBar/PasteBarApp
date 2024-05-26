#[cfg(target_os = "windows")]
use crate::errors::MIDError;

#[cfg(target_os = "windows")]
use serde::Deserialize;
#[cfg(target_os = "windows")]
use wmi::{COMLibrary, Variant, WMIConnection};

#[cfg(target_os = "windows")]
#[derive(Deserialize, Debug)]
struct Win32_ComputerSystemProduct {
  #[serde(rename = "UUID")]
  uuid: String,
}

#[cfg(target_os = "windows")]
pub(crate) fn get_hardware_uuid() -> Result<String, MIDError> {
  let com_con = COMLibrary::new().map_err(|_| MIDError::ResultMidError)?;
  let wmi_con = WMIConnection::new(com_con.into()).map_err(|_| MIDError::ResultMidError)?;

  let results: Vec<Win32_ComputerSystemProduct> = wmi_con
    .raw_query("SELECT UUID FROM Win32_ComputerSystemProduct")
    .map_err(|_| MIDError::ResultMidError)?;

  if let Some(product) = results.first() {
    Ok(product.uuid.clone().to_lowercase())
  } else {
    Err(MIDError::ResultMidError)
  }
}
