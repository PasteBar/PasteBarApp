use crate::services::shell_service::{self, ExecHomeDir, OutputRegexFilter, OutputTemplate};

#[tauri::command]
pub fn run_shell_command(
  exec_cmd: &str,
  exec_home_dir: Option<ExecHomeDir>,
  output_template: Option<OutputTemplate>,
  output_regex_filter: Option<OutputRegexFilter>,
) -> Result<String, String> {
  shell_service::run_shell_command(
    exec_cmd,
    exec_home_dir,
    output_template,
    output_regex_filter,
  )
}

#[tauri::command]
pub fn check_path(path: &str) -> Result<String, String> {
  shell_service::check_path(path)
}

#[tauri::command]
pub fn path_type_check(path: &str) -> Result<String, String> {
  shell_service::path_type_check(path)
}
