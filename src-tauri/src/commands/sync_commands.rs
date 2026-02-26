use once_cell::sync::Lazy;
use serde::Serialize;

use crate::db::establish_pool_db_connection;
use crate::sync::engine::SyncEngine;
use crate::sync::types::SyncMode;
use diesel::sql_types::BigInt;
use diesel::QueryableByName;
use diesel::RunQueryDsl;

static SYNC_ENGINE: Lazy<SyncEngine> = Lazy::new(SyncEngine::default);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncUiStatus {
  pub mode: String,
  pub state: String,
  pub pending_events: u64,
  pub dead_letter_events: u64,
  pub discovery_running: bool,
  pub session_running: bool,
  pub status_text: String,
  pub last_error: Option<String>,
}

#[derive(QueryableByName)]
struct CountRow {
  #[diesel(sql_type = BigInt)]
  total: i64,
}

#[tauri::command]
pub fn sync_get_ui_status() -> Result<SyncUiStatus, String> {
  build_sync_ui_status(None)
}

#[tauri::command]
pub fn sync_set_mode(mode: String) -> Result<SyncUiStatus, String> {
  let sync_mode = parse_sync_mode(&mode)?;
  crate::sync::commands::set_sync_mode(&SYNC_ENGINE, sync_mode)?;
  build_sync_ui_status(None)
}

#[tauri::command]
pub fn sync_retry() -> Result<SyncUiStatus, String> {
  let snapshot = SYNC_ENGINE.snapshot();

  if snapshot.mode == SyncMode::On {
    crate::sync::commands::set_sync_mode(&SYNC_ENGINE, SyncMode::Paused)?;
  }

  crate::sync::commands::set_sync_mode(&SYNC_ENGINE, SyncMode::On)?;
  build_sync_ui_status(None)
}

#[tauri::command]
pub fn sync_disconnect() -> Result<SyncUiStatus, String> {
  crate::sync::commands::set_sync_mode(&SYNC_ENGINE, SyncMode::Off)?;
  build_sync_ui_status(None)
}

fn build_sync_ui_status(last_error: Option<String>) -> Result<SyncUiStatus, String> {
  let snapshot = SYNC_ENGINE.snapshot();
  let mut conn = establish_pool_db_connection();

  let (pending_events, dead_letter_events, stats_error) = match SYNC_ENGINE.collect_stats(&mut conn)
  {
    Ok(stats) => (stats.pending_events, stats.dead_letter_events, None),
    Err(err) => (0, 0, Some(err)),
  };
  let (has_local_identity, identity_error) = match query_count(
    &mut conn,
    "SELECT COUNT(*) AS total FROM sync_meta",
  ) {
    Ok(total) => (total > 0, None),
    Err(err) => (false, Some(err)),
  };
  let (has_trusted_peers, peers_error) = match query_count(
    &mut conn,
    "SELECT COUNT(*) AS total FROM sync_peer_cursor WHERE is_trusted = 1 AND is_stale = 0",
  ) {
    Ok(total) => (total > 0, None),
    Err(err) => (false, Some(err)),
  };

  let mode = sync_mode_to_string(snapshot.mode).to_string();
  let effective_error = last_error.or(stats_error).or(identity_error).or(peers_error);
  let state = resolve_ui_state(
    &mode,
    pending_events,
    dead_letter_events,
    effective_error.is_some(),
    has_local_identity,
    has_trusted_peers,
  );
  let status_text = build_status_text(
    &state,
    &mode,
    pending_events,
    dead_letter_events,
    has_local_identity,
    has_trusted_peers,
  );

  Ok(SyncUiStatus {
    mode,
    state,
    pending_events,
    dead_letter_events,
    discovery_running: snapshot.discovery_running,
    session_running: snapshot.session_running,
    status_text,
    last_error: effective_error,
  })
}

fn parse_sync_mode(mode: &str) -> Result<SyncMode, String> {
  match mode.trim().to_ascii_lowercase().as_str() {
    "on" => Ok(SyncMode::On),
    "off" => Ok(SyncMode::Off),
    "paused" => Ok(SyncMode::Paused),
    _ => Err("Invalid sync mode. Use 'on', 'off', or 'paused'.".to_string()),
  }
}

fn sync_mode_to_string(mode: SyncMode) -> &'static str {
  match mode {
    SyncMode::Off => "off",
    SyncMode::On => "on",
    SyncMode::Paused => "paused",
  }
}

fn resolve_ui_state(
  mode: &str,
  pending_events: u64,
  dead_letter_events: u64,
  has_error: bool,
  has_local_identity: bool,
  has_trusted_peers: bool,
) -> String {
  if has_error || dead_letter_events > 0 {
    "error".to_string()
  } else if mode == "off" {
    "idle".to_string()
  } else if !has_local_identity || !has_trusted_peers {
    "attention".to_string()
  } else if pending_events > 0 || mode == "paused" {
    "attention".to_string()
  } else {
    "synced".to_string()
  }
}

fn build_status_text(
  state: &str,
  mode: &str,
  pending_events: u64,
  dead_letter_events: u64,
  has_local_identity: bool,
  has_trusted_peers: bool,
) -> String {
  match state {
    "synced" => "Synced".to_string(),
    "error" => {
      if dead_letter_events > 0 {
        format!("Errors: {} change(s) need action", dead_letter_events)
      } else {
        "Sync error detected".to_string()
      }
    }
    "attention" => {
      if !has_local_identity {
        "Sync setup required".to_string()
      } else if mode == "on" && !has_trusted_peers {
        "Sync is on. Pair another device to start syncing.".to_string()
      } else if pending_events > 0 {
        format!("Syncing {} pending change(s)", pending_events)
      } else {
        "Sync needs attention".to_string()
      }
    }
    _ => "Sync not configured".to_string(),
  }
}

fn query_count(
  conn: &mut diesel::sqlite::SqliteConnection,
  sql: &str,
) -> Result<i64, String> {
  let rows: Vec<CountRow> = diesel::sql_query(sql).load(conn).map_err(|e| e.to_string())?;
  rows
    .first()
    .map(|row| row.total)
    .ok_or_else(|| "Count query returned no rows".to_string())
}
