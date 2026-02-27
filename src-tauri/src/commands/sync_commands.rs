use once_cell::sync::Lazy;
use serde::Serialize;

use crate::db::establish_pool_db_connection;
use crate::sync::engine::SyncEngine;
use crate::sync::pairing_runtime::{
  local_device_id, PairingDiscoveredDevice, PairingPingResult, PairingRuntime,
};
use crate::sync::types::SyncMode;
use diesel::sql_types::{BigInt, Bool, Nullable, Text};
use diesel::QueryableByName;
use diesel::RunQueryDsl;
use std::time::{SystemTime, UNIX_EPOCH};

static SYNC_ENGINE: Lazy<SyncEngine> = Lazy::new(SyncEngine::default);
static PAIRING_RUNTIME: Lazy<PairingRuntime> = Lazy::new(PairingRuntime::default);

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
  pub discoverable: bool,
  pub discoverable_until_ms: Option<i64>,
  pub pair_code: Option<String>,
  pub history_auto_sync_enabled: bool,
  pub history_last_sync_at_ms: Option<i64>,
  pub history_last_sync_result: Option<String>,
  pub history_last_sync_sent_changes: u64,
  pub trusted_peers: u64,
  pub last_pairing_error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPeerInfo {
  pub peer_device_id: String,
  pub is_trusted: bool,
  pub is_stale: bool,
  pub last_seen_at: Option<i64>,
  pub last_applied_seq: i64,
  pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncDiscoveredDevice {
  pub host_device_id: String,
  pub source_addr: String,
  pub discoverable: bool,
  pub sync_enabled: bool,
  pub is_local: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPingResult {
  pub peer_device_id: String,
  pub source_addr: Option<String>,
  pub payload_id: String,
  pub payload_time: i64,
  pub pong: bool,
  pub round_trip_ms: Option<i64>,
  pub request_json: String,
  pub response_json: Option<String>,
  pub error: Option<String>,
}

#[derive(QueryableByName)]
struct CountRow {
  #[diesel(sql_type = BigInt)]
  total: i64,
}

#[derive(QueryableByName)]
struct PeerRow {
  #[diesel(sql_type = Text)]
  peer_device_id: String,
  #[diesel(sql_type = Bool)]
  is_trusted: bool,
  #[diesel(sql_type = Bool)]
  is_stale: bool,
  #[diesel(sql_type = Nullable<BigInt>)]
  last_seen_at: Option<i64>,
  #[diesel(sql_type = BigInt)]
  last_applied_seq: i64,
  #[diesel(sql_type = BigInt)]
  updated_at: i64,
}

#[tauri::command]
pub fn sync_get_ui_status() -> Result<SyncUiStatus, String> {
  build_sync_ui_status(None)
}

#[tauri::command]
pub fn sync_set_mode(mode: String) -> Result<SyncUiStatus, String> {
  let sync_mode = parse_sync_mode(&mode)?;
  if sync_mode == SyncMode::On {
    let mut conn = establish_pool_db_connection();
    ensure_local_sync_identity(&mut conn)?;
  }
  crate::sync::commands::set_sync_mode(&SYNC_ENGINE, sync_mode)?;
  reconcile_pairing_runtime(sync_mode)?;
  build_sync_ui_status(None)
}

#[tauri::command]
pub fn sync_retry() -> Result<SyncUiStatus, String> {
  let snapshot = SYNC_ENGINE.snapshot();
  if snapshot.mode == SyncMode::On {
    crate::sync::commands::set_sync_mode(&SYNC_ENGINE, SyncMode::Paused)?;
    reconcile_pairing_runtime(SyncMode::Paused)?;
  }

  {
    let mut conn = establish_pool_db_connection();
    ensure_local_sync_identity(&mut conn)?;
  }

  crate::sync::commands::set_sync_mode(&SYNC_ENGINE, SyncMode::On)?;
  reconcile_pairing_runtime(SyncMode::On)?;
  build_sync_ui_status(None)
}

#[tauri::command]
pub fn sync_disconnect() -> Result<SyncUiStatus, String> {
  crate::sync::commands::set_sync_mode(&SYNC_ENGINE, SyncMode::Off)?;
  reconcile_pairing_runtime(SyncMode::Off)?;

  let mut conn = establish_pool_db_connection();
  diesel::sql_query("DELETE FROM sync_peer_cursor")
    .execute(&mut conn)
    .map_err(|e| e.to_string())?;

  build_sync_ui_status(None)
}

#[tauri::command]
pub fn sync_generate_pair_code() -> Result<SyncUiStatus, String> {
  if SYNC_ENGINE.snapshot().mode != SyncMode::On {
    crate::sync::commands::set_sync_mode(&SYNC_ENGINE, SyncMode::On)?;
  }
  reconcile_pairing_runtime(SyncMode::On)?;

  let mut conn = establish_pool_db_connection();
  ensure_local_sync_identity(&mut conn)?;
  PAIRING_RUNTIME.generate_pair_code()?;
  build_sync_ui_status(None)
}

#[tauri::command]
pub fn sync_cancel_pair_code() -> Result<SyncUiStatus, String> {
  PAIRING_RUNTIME.cancel_pair_code()?;
  build_sync_ui_status(None)
}

#[tauri::command]
pub fn sync_join_with_code(code: String) -> Result<SyncUiStatus, String> {
  if SYNC_ENGINE.snapshot().mode != SyncMode::On {
    crate::sync::commands::set_sync_mode(&SYNC_ENGINE, SyncMode::On)?;
  }
  reconcile_pairing_runtime(SyncMode::On)?;

  let mut conn = establish_pool_db_connection();
  let local_id = ensure_local_sync_identity(&mut conn)?;
  let join_result = PAIRING_RUNTIME.join_with_code(&code, &local_id)?;
  upsert_trusted_peer(&mut conn, &join_result.host_device_id)?;

  build_sync_ui_status(None)
}

#[tauri::command]
pub fn sync_scan_network_devices() -> Result<Vec<SyncDiscoveredDevice>, String> {
  let mut conn = establish_pool_db_connection();
  let local_id = ensure_local_sync_identity(&mut conn)?;
  let devices = PAIRING_RUNTIME.scan_network_devices(&local_id)?;

  Ok(
    devices
      .into_iter()
      .map(
        |PairingDiscoveredDevice {
           host_device_id,
           source_addr,
           discoverable,
           sync_enabled,
         }| SyncDiscoveredDevice {
          is_local: host_device_id == local_id,
          host_device_id,
          source_addr,
          discoverable,
          sync_enabled,
        },
      )
      .collect(),
  )
}

#[tauri::command]
pub fn sync_history_now() -> Result<SyncUiStatus, String> {
  let snapshot = SYNC_ENGINE.snapshot();
  if snapshot.mode != SyncMode::On {
    return Err("Sync must be ON before syncing history.".to_string());
  }

  PAIRING_RUNTIME.sync_history_now()?;
  build_sync_ui_status(None)
}

#[tauri::command]
pub fn sync_set_history_auto_sync(enabled: bool) -> Result<SyncUiStatus, String> {
  PAIRING_RUNTIME.set_history_auto_sync_enabled(enabled)?;
  build_sync_ui_status(None)
}

#[tauri::command]
pub fn sync_ping_peers_json() -> Result<Vec<SyncPingResult>, String> {
  let mut conn = establish_pool_db_connection();
  let local_id = ensure_local_sync_identity(&mut conn)?;
  let responses = PAIRING_RUNTIME.ping_trusted_peers(&local_id)?;

  Ok(
    responses
      .into_iter()
      .map(
        |PairingPingResult {
           peer_device_id,
           source_addr,
           payload_id,
           payload_time,
           pong,
           round_trip_ms,
           request_json,
           response_json,
           error,
         }| SyncPingResult {
          peer_device_id,
          source_addr,
          payload_id,
          payload_time,
          pong,
          round_trip_ms,
          request_json,
          response_json,
          error,
        },
      )
      .collect(),
  )
}

#[tauri::command]
pub fn sync_list_peers() -> Result<Vec<SyncPeerInfo>, String> {
  let mut conn = establish_pool_db_connection();
  let rows: Vec<PeerRow> = diesel::sql_query(
    "SELECT
      peer_device_id,
      is_trusted,
      is_stale,
      last_seen_at,
      last_applied_seq,
      updated_at
     FROM sync_peer_cursor
     ORDER BY updated_at DESC",
  )
  .load(&mut conn)
  .map_err(|e| e.to_string())?;

  Ok(
    rows
      .into_iter()
      .map(|row| SyncPeerInfo {
        peer_device_id: row.peer_device_id,
        is_trusted: row.is_trusted,
        is_stale: row.is_stale,
        last_seen_at: row.last_seen_at,
        last_applied_seq: row.last_applied_seq,
        updated_at: row.updated_at,
      })
      .collect(),
  )
}

#[tauri::command]
pub fn sync_remove_peer(peer_device_id: String) -> Result<SyncUiStatus, String> {
  let trimmed = peer_device_id.trim();
  if trimmed.is_empty() {
    return Err("Peer device id is required.".to_string());
  }

  let mut conn = establish_pool_db_connection();
  diesel::sql_query("DELETE FROM sync_peer_cursor WHERE peer_device_id = ?")
    .bind::<Text, _>(trimmed.to_string())
    .execute(&mut conn)
    .map_err(|e| e.to_string())?;

  build_sync_ui_status(None)
}

fn build_sync_ui_status(last_error: Option<String>) -> Result<SyncUiStatus, String> {
  let snapshot = SYNC_ENGINE.snapshot();
  let pairing_snapshot = PAIRING_RUNTIME.snapshot()?;
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
  let (trusted_peers, peers_error) = match query_count(
    &mut conn,
    "SELECT COUNT(*) AS total FROM sync_peer_cursor WHERE is_trusted = 1 AND is_stale = 0",
  ) {
    Ok(total) => (total as u64, None),
    Err(err) => (0, Some(err)),
  };

  let mode = sync_mode_to_string(snapshot.mode).to_string();
  let has_trusted_peers = trusted_peers > 0;
  let effective_error = last_error.or(stats_error).or(identity_error).or(peers_error);
  let has_any_error = effective_error.is_some() || pairing_snapshot.last_error.is_some();

  let state = resolve_ui_state(
    &mode,
    pending_events,
    dead_letter_events,
    has_any_error,
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
    pairing_snapshot.discoverable,
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
    discoverable: pairing_snapshot.discoverable,
    discoverable_until_ms: pairing_snapshot.discoverable_until_ms,
    pair_code: pairing_snapshot.pair_code,
    history_auto_sync_enabled: pairing_snapshot.history_auto_sync_enabled,
    history_last_sync_at_ms: pairing_snapshot.history_last_sync_at_ms,
    history_last_sync_result: pairing_snapshot.history_last_sync_result,
    history_last_sync_sent_changes: pairing_snapshot.history_last_sync_sent_changes as u64,
    trusted_peers,
    last_pairing_error: pairing_snapshot.last_error,
  })
}

fn reconcile_pairing_runtime(mode: SyncMode) -> Result<(), String> {
  let enabled = mode == SyncMode::On;
  PAIRING_RUNTIME.set_enabled(enabled)
}

fn ensure_local_sync_identity(
  conn: &mut diesel::sqlite::SqliteConnection,
) -> Result<String, String> {
  let device_id = local_device_id();
  let now = now_ms();

  diesel::sql_query(
    "INSERT INTO sync_meta (
      device_id, protocol_version, created_at, updated_at
    ) VALUES (
      ?, 1, ?, ?
    )
    ON CONFLICT(device_id) DO UPDATE SET
      protocol_version = excluded.protocol_version,
      updated_at = excluded.updated_at",
  )
  .bind::<Text, _>(device_id.clone())
  .bind::<BigInt, _>(now)
  .bind::<BigInt, _>(now)
  .execute(conn)
  .map_err(|e| e.to_string())?;

  Ok(device_id)
}

fn upsert_trusted_peer(
  conn: &mut diesel::sqlite::SqliteConnection,
  peer_device_id: &str,
) -> Result<(), String> {
  let now = now_ms();
  diesel::sql_query(
    "INSERT INTO sync_peer_cursor (
      peer_device_id, last_acked_seq, last_applied_seq, is_trusted, is_stale, last_seen_at, created_at, updated_at
    ) VALUES (
      ?, 0, 0, 1, 0, ?, ?, ?
    )
    ON CONFLICT(peer_device_id) DO UPDATE SET
      is_trusted = 1,
      is_stale = 0,
      last_seen_at = excluded.last_seen_at,
      updated_at = excluded.updated_at",
  )
  .bind::<Text, _>(peer_device_id.to_string())
  .bind::<BigInt, _>(now)
  .bind::<BigInt, _>(now)
  .bind::<BigInt, _>(now)
  .execute(conn)
  .map_err(|e| e.to_string())?;
  Ok(())
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
  discoverable: bool,
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
      } else if mode == "on" && !has_trusted_peers && discoverable {
        "Discoverable for 1 minute. Share this code with your other device.".to_string()
      } else if mode == "on" && !has_trusted_peers {
        "Sync is on. Generate a 6-digit code to pair another device.".to_string()
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

fn now_ms() -> i64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default()
    .as_millis() as i64
}
