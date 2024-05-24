#[cfg(target_os = "macos")]
use crate::errors::MIDError;

#[cfg(target_os = "macos")]
use crate::utils::run_shell_comand;

#[cfg(target_os = "macos")]
pub(crate) fn get_mid_result() -> Result<String, MIDError> {
    let system_profiler_output = run_shell_comand(
        "sh",
        [
            "-c",
            r#"system_profiler SPHardwareDataType SPSecureElementDataType"#,
        ],
    )?;

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
