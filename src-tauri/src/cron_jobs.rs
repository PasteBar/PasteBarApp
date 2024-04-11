use crate::commands::history_commands;
use crate::services::settings_service::get_all_settings;
use crate::services::utils::debug_output;
use clokwerk::Scheduler;
pub static SCHEDULER: once_cell::sync::Lazy<std::sync::Mutex<Scheduler>> =
  once_cell::sync::Lazy::new(|| std::sync::Mutex::new(Scheduler::new()));

pub fn setup_cron_jobs() {
  let mut scheduler = SCHEDULER.lock().unwrap();

  run_history_cleanup_job();

  scheduler
    .every(clokwerk::Interval::Hours(1))
    .run(run_history_cleanup_job);
}

fn run_history_cleanup_job() {
  let app_settings = get_all_settings(None).unwrap_or_default(); // Fetch latest settings
  let locked_settings = app_settings.lock().unwrap();

  let auto_clear_enabled = locked_settings
    .get("isAutoClearSettingsEnabled")
    .and_then(|s| s.value_bool)
    .unwrap_or(false);

  if auto_clear_enabled {
    let duration_type: String = locked_settings
      .get("autoClearSettingsDurationType")
      .and_then(|s| s.value_text.clone())
      .unwrap_or("months".to_string());
    let duration = locked_settings
      .get("autoClearSettingsDuration")
      .and_then(|s| s.value_int)
      .unwrap_or(1);

    let deleted_count =
      history_commands::clear_clipboard_history_older_than(duration_type, duration.to_string());

    debug_output(|| {
      println!("Deleted {} items from clipboard history", deleted_count);
    });
  }
}

pub fn run_pending_jobs() {
  let mut scheduler = SCHEDULER.lock().unwrap();
  scheduler.run_pending();
}
