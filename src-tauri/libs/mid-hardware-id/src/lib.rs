//! Creating a Machine ID hash for MacOS/Windows/Linux.
//!
//! ```
//! let machine_id = mid::get("mySecretKey").unwrap();
//! ```

mod errors;
mod linux;
mod macos;
mod utils;
mod windows;

use errors::MIDError;
use hmac_sha256::HMAC;

#[cfg(target_os = "linux")]
use linux::get_mid_result;
#[cfg(target_os = "macos")]
use macos::get_mid_result;
#[cfg(target_os = "windows")]
use windows::get_mid_result;

#[derive(Debug)]
pub struct MidData {
    pub key: String,
    pub result: Vec<String>,
    pub hash: String,
}

/// Gets unique platform metrics and returns a `Result`, which can be a MID hash (SHA-256) or a `MIDError`.
///
/// # Errors
///
/// Returns [`Err`] if an error occurred while creating the MachineID.
///
/// # Examples
///
/// ```
/// fn get_machine_id() -> Result<String, String> {
///   match mid::get("mySecretKey") {
///       Ok(mid) => Ok(mid),
///       Err(err) => {
///           println!("MID error: {}", err.to_string());
///           Err(err.to_string())
///       }
///   }
/// }
/// ```
pub fn get(key: &str) -> Result<String, MIDError> {
    match data(key) {
        Ok(mid) => Ok(mid.hash),
        Err(err) => Err(err),
    }
}

/// Returns MID key/result/hash as [`MidData`]
///
/// # Errors
///
/// Returns [`Err`] if an error occurred while creating the MachineID.
///
/// # Examples
///
/// ```
/// let mid_data = mid::data("mySecretKey").unwrap();
/// ```
pub fn data(key: &str) -> Result<MidData, MIDError> {
    if key.is_empty() {
        return Err(MIDError::EmptyMidKey);
    }

    match get_mid_result() {
        Ok(mid) => {
            let mid_result: Vec<String> = mid.split('|').map(|s| s.to_string()).collect();

            let hmac_result = HMAC::mac(mid.as_bytes(), key.as_bytes());
            let mid_hash = hex::encode(hmac_result);

            Ok(MidData {
                key: String::from(key),
                result: mid_result,
                hash: mid_hash,
            })
        }
        Err(err) => Err(err),
    }
}

/// Output the MID key/result/hash to the console in `debug_assertions` mode.
///
/// `MID key` - The secret key for hashing
///
/// `MID result` - Array of OS parameters
///
/// `MID hash` - SHA-256 hash from result
///
/// # Examples
///
/// ```
/// mid::print("mySecretKey");
/// ```
pub fn print(key: &str) {
    match data(key) {
        Ok(mid) => {
            debug!("MID.print[key]: {}", mid.key);
            debug!("MID.print[result]: {:?}", mid.result);
            debug!("MID.print[hash]: {}", mid.hash);
        }
        Err(err) => debug!("MID.print[error]: {}", err),
    }
}

#[test]
fn test_mid_operations() {
    match get("mykey") {
        Ok(mid) => debug!("MID.get: {}", mid),
        Err(err) => debug!("MID.get[error]: {}", err),
    }

    match data("mykey") {
        Ok(log_data) => debug!("MID.data: {:?}", log_data),
        Err(err) => debug!("MID.data[error]: {}", err),
    }

    print("mykey");
}
