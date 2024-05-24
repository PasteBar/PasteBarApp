#[cfg(target_os = "linux")]
use std::collections::HashSet;

#[cfg(target_os = "linux")]
use crate::errors::MIDError;

#[cfg(target_os = "linux")]
use crate::utils::run_shell_comand;

#[cfg(target_os = "linux")]
pub(crate) fn get_mid_result() -> Result<String, MIDError> {
    let machine_output = run_shell_comand(
        "sh",
        [
            "-c",
            r#"hostnamectl status | awk '/Machine ID:/ {print $3}'; cat /var/lib/dbus/machine-id || true; cat /etc/machine-id || true"#,
        ],
    )?;

    let combined_string = process_output(&machine_output);

    if combined_string.is_empty() {
        return Err(MIDError::ResultMidError);
    }

    Ok(combined_string)
}

#[cfg(target_os = "linux")]
fn process_output(output_str: &str) -> String {
    let mut md5_hashes = HashSet::new();

    for line in output_str.to_lowercase().lines() {
        if line.len() == 32 && line.chars().all(|c| c.is_ascii_hexdigit()) {
            md5_hashes.insert(line.to_string());
        }
    }

    md5_hashes
        .iter()
        .map(|s| s.as_str())
        .collect::<Vec<&str>>()
        .join("|")
        .trim()
        .to_string()
}
