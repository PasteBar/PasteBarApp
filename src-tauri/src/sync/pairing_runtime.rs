use diesel::sql_types::{BigInt, Bool, Text};
use diesel::QueryableByName;
use diesel::RunQueryDsl;
use if_addrs::{get_if_addrs, IfAddr};
use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use once_cell::sync::Lazy;
use rand::Rng;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::net::{IpAddr, Ipv4Addr, SocketAddr, UdpSocket};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use crate::db::establish_pool_db_connection;
use crate::services::utils::debug_output;
use crate::sync::apply_context::enable_remote_apply_context;
use crate::sync::history_sync::{
  apply_history_changes, backfill_history_outbox_from_existing, load_history_changes_since,
  HistorySyncChange,
};

pub fn now_ms() -> i64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_millis()
    .try_into()
    .unwrap()
}

const PAIRING_PORT: u16 = 45879;
const DISCOVERABLE_WINDOW_MS: i64 = 60_000;
const SOCKET_POLL_TIMEOUT_MS: u64 = 250;
const JOIN_ATTEMPTS: usize = 3;
const JOIN_WAIT_PER_ATTEMPT_MS: i64 = 1_500;
const DISCOVERY_ATTEMPTS: usize = 2;
const DISCOVERY_WAIT_PER_ATTEMPT_MS: i64 = 900;
const HISTORY_SYNC_ATTEMPTS: usize = 2;
const HISTORY_SYNC_WAIT_PER_ATTEMPT_MS: i64 = 1_200;
const HISTORY_SYNC_BATCH_LIMIT: i64 = 200;
const HISTORY_BACKFILL_LIMIT: i64 = 2_000;
const HISTORY_SYNC_WINDOW_MS: i64 = 60 * 60 * 1000;
const HISTORY_SYNC_MAX_PACKET_BYTES: usize = 48 * 1024;
const HISTORY_AUTO_SYNC_INTERVAL_MS: u64 = 5_000;
const PING_ATTEMPTS: usize = 2;
const PING_WAIT_PER_ATTEMPT_MS: i64 = 1_000;
const MAX_SUBNET_SWEEP_HOSTS_PER_INTERFACE: usize = 256;
const MDNS_SERVICE_TYPE: &str = "_pastebar-sync._udp.local";

static LOCAL_DEVICE_ID: Lazy<String> = Lazy::new(resolve_local_device_id);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
enum PairingPacket {
  PairRequest {
    request_id: String,
    code: String,
    requester_device_id: String,
  },
  PairAck {
    request_id: String,
    accepted: bool,
    host_device_id: String,
    reason: Option<String>,
  },
  DiscoveryProbe {
    request_id: String,
    requester_device_id: String,
  },
  DiscoveryAck {
    request_id: String,
    host_device_id: String,
    discoverable: bool,
    sync_enabled: bool,
  },
  HistorySyncPush {
    request_id: String,
    source_device_id: String,
    target_device_id: String,
    changes: Vec<HistorySyncChange>,
  },
  HistorySyncAck {
    request_id: String,
    host_device_id: String,
    accepted: bool,
    applied_count: usize,
    last_applied_seq: i64,
    reason: Option<String>,
  },
  PingJson {
    request_id: String,
    source_device_id: String,
    target_device_id: String,
    id: String,
    time: i64,
    pong: bool,
  },
  PongJson {
    request_id: String,
    source_device_id: String,
    target_device_id: String,
    id: String,
    time: i64,
    pong: bool,
  },
}

#[derive(Debug, Clone)]
struct PairingState {
  enabled: bool,
  history_auto_sync_enabled: bool,
  history_last_sync_at_ms: Option<i64>,
  history_last_sync_result: Option<String>,
  history_last_sync_sent_changes: usize,
  pair_code: Option<String>,
  discoverable_until_ms: Option<i64>,
  last_error: Option<String>,
}

impl Default for PairingState {
  fn default() -> Self {
    Self {
      enabled: false,
      history_auto_sync_enabled: true,
      history_last_sync_at_ms: None,
      history_last_sync_result: None,
      history_last_sync_sent_changes: 0,
      pair_code: None,
      discoverable_until_ms: None,
      last_error: None,
    }
  }
}

#[derive(Debug, Clone)]
pub struct PairingSnapshot {
  pub discoverable: bool,
  pub discoverable_until_ms: Option<i64>,
  pub pair_code: Option<String>,
  pub history_auto_sync_enabled: bool,
  pub history_last_sync_at_ms: Option<i64>,
  pub history_last_sync_result: Option<String>,
  pub history_last_sync_sent_changes: usize,
  pub last_error: Option<String>,
}

#[derive(Debug, Clone)]
pub struct PairingJoinResult {
  pub host_device_id: String,
}

#[derive(Debug, Clone)]
pub struct PairingDiscoveredDevice {
  pub host_device_id: String,
  pub source_addr: String,
  pub discoverable: bool,
  pub sync_enabled: bool,
}

#[derive(Debug, Clone)]
pub struct PairingPingResult {
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
struct PeerSyncCursorRow {
  #[diesel(sql_type = Text)]
  peer_device_id: String,
  #[diesel(sql_type = BigInt)]
  last_acked_seq: i64,
}

#[derive(QueryableByName)]
struct PeerTrustRow {
  #[diesel(sql_type = Bool)]
  is_trusted: bool,
}

#[derive(QueryableByName)]
struct HistoryOutboxStatsRow {
  #[diesel(sql_type = BigInt)]
  latest_seq: i64,
  #[diesel(sql_type = BigInt)]
  total_rows: i64,
  #[diesel(sql_type = BigInt)]
  pending_rows: i64,
}

#[derive(QueryableByName)]
struct SyncMetaDeviceRow {
  #[diesel(sql_type = Text)]
  device_id: String,
}

#[derive(Clone)]
pub struct PairingRuntime {
  state: Arc<Mutex<PairingState>>,
  stop_signal: Arc<AtomicBool>,
  auto_sync_stop_signal: Arc<AtomicBool>,
  auto_sync_worker: Arc<Mutex<Option<JoinHandle<()>>>>,
  mdns_advertiser: Arc<Mutex<Option<MdnsAdvertiser>>>,
}

struct MdnsAdvertiser {
  daemon: ServiceDaemon,
  service_fullname: Option<String>,
}

impl Default for PairingRuntime {
  fn default() -> Self {
    Self {
      state: Arc::new(Mutex::new(PairingState::default())),
      stop_signal: Arc::new(AtomicBool::new(false)),
      auto_sync_stop_signal: Arc::new(AtomicBool::new(false)),
      auto_sync_worker: Arc::new(Mutex::new(None)),
      mdns_advertiser: Arc::new(Mutex::new(None)),
    }
  }
}

impl PairingRuntime {
  pub fn set_enabled(&self, enabled: bool) -> Result<(), String> {
    if enabled {
      let should_start_auto_sync = {
        let mut state = self
          .state
          .lock()
          .map_err(|_| "Pairing state lock poisoned".to_string())?;
        state.enabled = true;
        state.history_auto_sync_enabled
      };
      if should_start_auto_sync {
        self.start_history_auto_sync_worker()?;
      }
      let _ = refresh_mdns_advertisement(&self.state, &self.mdns_advertiser);
      Ok(())
    } else {
      {
        let mut state = self
          .state
          .lock()
          .map_err(|_| "Pairing state lock poisoned".to_string())?;
        state.enabled = false;
        state.pair_code = None;
        state.discoverable_until_ms = None;
      }
      self.stop_history_auto_sync_worker();
      let _ = refresh_mdns_advertisement(&self.state, &self.mdns_advertiser);
      Ok(())
    }
  }

  pub fn set_history_auto_sync_enabled(&self, enabled: bool) -> Result<(), String> {
    let sync_is_enabled = {
      let mut state = self
        .state
        .lock()
        .map_err(|_| "Pairing state lock poisoned".to_string())?;
      state.history_auto_sync_enabled = enabled;
      state.enabled
    };

    if enabled && sync_is_enabled {
      self.start_history_auto_sync_worker()?;
    } else if !enabled {
      self.stop_history_auto_sync_worker();
    }

    Ok(())
  }

  pub fn generate_pair_code(&self) -> Result<String, String> {
    let mut state = self
      .state
      .lock()
      .map_err(|_| "Pairing state lock poisoned".to_string())?;
    if !state.enabled {
      return Err("Sync must be enabled before generating a pair code.".to_string());
    }

    let mut rng = rand::thread_rng();
    let code = format!("{:06}", rng.gen_range(0..1_000_000));
    state.pair_code = Some(code.clone());
    state.discoverable_until_ms = Some(now_ms() + DISCOVERABLE_WINDOW_MS);
    state.last_error = None;
    drop(state);
    let _ = refresh_mdns_advertisement(&self.state, &self.mdns_advertiser);
    Ok(code)
  }

  pub fn cancel_pair_code(&self) -> Result<(), String> {
    let mut state = self
      .state
      .lock()
      .map_err(|_| "Pairing state lock poisoned".to_string())?;
    state.pair_code = None;
    state.discoverable_until_ms = None;
    drop(state);
    let _ = refresh_mdns_advertisement(&self.state, &self.mdns_advertiser);
    Ok(())
  }

  pub fn clear_last_error(&self) -> Result<(), String> {
    let mut state = self
      .state
      .lock()
      .map_err(|_| "Pairing state lock poisoned".to_string())?;
    state.last_error = None;
    Ok(())
  }

  pub async fn join_with_code(
    &self,
    code: &str,
    requester_device_id: &str,
  ) -> Result<PairingJoinResult, String> {
    let sanitized_code = code.trim();
    if sanitized_code.len() != 6 || !sanitized_code.chars().all(|ch| ch.is_ascii_digit()) {
      return Err("Pair code must be exactly 6 digits.".to_string());
    }

    {
      let state = self
        .state
        .lock()
        .map_err(|_| "Pairing state lock poisoned".to_string())?;
      if !state.enabled {
        return Err("Sync must be enabled before pairing.".to_string());
      }
    }

    let request_id = nanoid::nanoid!(12);
    let request_packet = crate::sync::types::PairRequestInfo {
      request_id: request_id.clone(),
      code: sanitized_code.to_string(),
      requester_device_id: requester_device_id.to_string(),
    };

    let mut last_rejection: Option<String> = None;

    let client = reqwest::Client::builder()
      .timeout(Duration::from_millis(SOCKET_POLL_TIMEOUT_MS))
      .build()
      .map_err(|e| format!("Failed to build reqwest client: {}", e))?;

    for _ in 0..JOIN_ATTEMPTS {
      let peers = {
        let ips = crate::sync::discovery::get_peer_ips().read().unwrap();
        ips.values().cloned().collect::<Vec<_>>()
      };

      if peers.is_empty() {
        tokio::time::sleep(Duration::from_millis(JOIN_WAIT_PER_ATTEMPT_MS as u64)).await;
        continue;
      }

      for addr in peers {
        let url = format!("http://{}:{}/sync/pair/request", addr.ip(), addr.port());
        
        if let Ok(resp) = client.post(&url).json(&request_packet).send().await {
          if resp.status().is_success() {
            if let Ok(ack_packet) = resp.json::<crate::sync::types::PairAckResponse>().await {
              if ack_packet.request_id != request_id {
                continue;
              }

              if should_ignore_rejection_for_self_not_discoverable(
                ack_packet.accepted,
                &ack_packet.host_device_id,
                requester_device_id,
                ack_packet.reason.as_deref(),
              ) {
                continue;
              }

              if ack_packet.accepted {
                self.clear_last_error()?;
                return Ok(PairingJoinResult { 
                  host_device_id: ack_packet.host_device_id 
                });
              }

              let rejection_reason = ack_packet.reason.unwrap_or_else(|| "pairing_rejected".to_string());
              last_rejection = Some(humanize_rejection_reason(&rejection_reason));
            }
          }
        }
      }
      
      tokio::time::sleep(Duration::from_millis(JOIN_WAIT_PER_ATTEMPT_MS as u64)).await;
    }

    let error = last_rejection.unwrap_or_else(|| {
      "No discoverable device accepted this code. Generate a new 6-digit code and retry."
        .to_string()
    });
    self.set_last_error(error.clone())?;
    Err(error)
  }

  pub fn scan_network_devices(
    &self,
    requester_device_id: &str,
  ) -> Result<Vec<PairingDiscoveredDevice>, String> {
    {
      let state = self
        .state
        .lock()
        .map_err(|_| "Pairing state lock poisoned".to_string())?;
      if !state.enabled {
        return Err("Sync must be enabled before scanning nearby devices.".to_string());
      }
    }

    let mut discovered: BTreeMap<String, PairingDiscoveredDevice> = BTreeMap::new();
    for mdns_device in scan_mdns_devices(requester_device_id, &self.mdns_advertiser) {
      discovered.insert(mdns_device.host_device_id.clone(), mdns_device);
    }

    let mut devices: Vec<PairingDiscoveredDevice> = discovered.into_values().collect();
    devices.sort_by(|a, b| {
      b.discoverable
        .cmp(&a.discoverable)
        .then_with(|| a.host_device_id.cmp(&b.host_device_id))
    });
    Ok(devices)
  }

  pub async fn sync_history_now(&self) -> Result<usize, String> {
    sync_history_now_internal(&self.state).await
  }

  pub async fn ping_trusted_peers(
    &self,
    requester_device_id: &str,
  ) -> Result<Vec<PairingPingResult>, String> {
    {
      let state = self
        .state
        .lock()
        .map_err(|_| "Pairing state lock poisoned".to_string())?;
      if !state.enabled {
        return Err("Sync must be enabled before ping.".to_string());
      }
    }

    let peers = trusted_peers_with_cursor()?;
    if peers.is_empty() {
      return Err("No trusted peers available for ping.".to_string());
    }

    let client = reqwest::Client::builder()
      .timeout(Duration::from_millis(SOCKET_POLL_TIMEOUT_MS))
      .build()
      .map_err(|e| format!("Failed to build reqwest client: {}", e))?;

    let mut results: Vec<PairingPingResult> = Vec::new();

    for peer in peers {
      let ping_started_at = now_ms();
      let request_id = nanoid::nanoid!(12);
      let payload_id = nanoid::nanoid!(10);
      let payload_time = now_ms();
      let ping_request = crate::sync::types::PingRequest {
        request_id: request_id.clone(),
        source_device_id: requester_device_id.to_string(),
        target_device_id: peer.peer_device_id.clone(),
        id: payload_id.clone(),
        time: payload_time,
        pong: false,
      };
      let request_json = json!({
        "id": payload_id,
        "time": payload_time,
        "pong": false
      })
      .to_string();

      let peer_ip_lookup = {
        let ips = crate::sync::discovery::get_peer_ips().read().unwrap();
        ips.get(&peer.peer_device_id).cloned()
      };

      let mut matched: Option<PairingPingResult> = None;

      if let Some(target_addr) = peer_ip_lookup {
        let url = format!("http://{}/sync/ping", target_addr);
        for _ in 0..PING_ATTEMPTS {
          match client.post(&url).json(&ping_request).send().await {
            Ok(resp) => {
              if resp.status().is_success() {
                if let Ok(pong_resp) = resp.json::<crate::sync::types::PongResponse>().await {
                  let round_trip_ms = (now_ms() - ping_started_at).max(0);
                  let response_json = json!({
                    "id": pong_resp.id,
                    "time": pong_resp.time,
                    "pong": true
                  })
                  .to_string();

                  matched = Some(PairingPingResult {
                    peer_device_id: peer.peer_device_id.clone(),
                    source_addr: Some(target_addr.to_string()),
                    payload_id: payload_id.clone(),
                    payload_time,
                    pong: true,
                    round_trip_ms: Some(round_trip_ms),
                    request_json: request_json.clone(),
                    response_json: Some(response_json),
                    error: None,
                  });
                  break;
                }
              }
            }
            Err(_) => {}
          }
          tokio::time::sleep(Duration::from_millis(PING_WAIT_PER_ATTEMPT_MS as u64)).await;
        }
      }

      let result = matched.unwrap_or_else(|| PairingPingResult {
        peer_device_id: peer.peer_device_id.clone(),
        source_addr: peer_ip_lookup.map(|a| a.to_string()),
        payload_id: payload_id.clone(),
        payload_time,
        pong: false,
        round_trip_ms: None,
        request_json: request_json.clone(),
        response_json: None,
        error: Some(if peer_ip_lookup.is_none() { "peer_offline_mdns".to_string() } else { "http_req_failed".to_string() }),
      });

      debug_output(|| {
        println!(
          "[sync-ping] peer={} payload_id={} pong={} rtt_ms={:?} error={:?}",
          result.peer_device_id, result.payload_id, result.pong, result.round_trip_ms, result.error
        );
      });
      results.push(result);
    }

    Ok(results)
  }

  pub fn snapshot(&self) -> Result<PairingSnapshot, String> {
    let mdns_needs_refresh = {
      let mut state = self
        .state
        .lock()
        .map_err(|_| "Pairing state lock poisoned".to_string())?;
      let discoverable_before = state.pair_code.is_some();
      expire_discoverable_window(&mut state, now_ms());
      let discoverable_after = state.pair_code.is_some();
      discoverable_before != discoverable_after
    };
    if mdns_needs_refresh {
      let _ = refresh_mdns_advertisement(&self.state, &self.mdns_advertiser);
    }

    let state = self
      .state
      .lock()
      .map_err(|_| "Pairing state lock poisoned".to_string())?;
    Ok(PairingSnapshot {
      discoverable: state.enabled && state.pair_code.is_some(),
      discoverable_until_ms: state.discoverable_until_ms,
      pair_code: state.pair_code.clone(),
      history_auto_sync_enabled: state.history_auto_sync_enabled,
      history_last_sync_at_ms: state.history_last_sync_at_ms,
      history_last_sync_result: state.history_last_sync_result.clone(),
      history_last_sync_sent_changes: state.history_last_sync_sent_changes,
      last_error: state.last_error.clone(),
    })
  }

  pub fn handle_ping_request(
    &self,
    req: crate::sync::types::PingRequest,
  ) -> Result<crate::sync::types::PongResponse, String> {
    if !matches_local_target_device(&req.target_device_id) {
      return Err("Mismatch target_device_id".to_string());
    }

    let is_enabled = self.state.lock().map(|s| s.enabled).unwrap_or(false);
    if !is_enabled {
      return Err("Sync is disabled".to_string());
    }

    Ok(crate::sync::types::PongResponse {
      request_id: req.request_id,
      source_device_id: local_device_id(),
      target_device_id: req.source_device_id,
      id: req.id,
      time: req.time,
      pong: true,
    })
  }

  pub fn handle_pair_request(
    &self,
    req: crate::sync::types::PairRequestInfo,
  ) -> Result<crate::sync::types::PairAckResponse, String> {
    let now = now_ms();
    let mut refresh_mdns = false;
    
    let (accepted, reason, _) = if let Ok(mut runtime_state) = self.state.lock() {
      if !runtime_state.enabled {
        (false, Some("sync_off".to_string()), false)
      } else {
        let discoverable_before = runtime_state.pair_code.is_some();
        expire_discoverable_window(&mut runtime_state, now);
        refresh_mdns = discoverable_before != runtime_state.pair_code.is_some();

        match runtime_state.pair_code.as_deref() {
          Some(active_code) if active_code == req.code => {
            runtime_state.pair_code = None;
            runtime_state.discoverable_until_ms = None;
            runtime_state.last_error = None;
            (true, None, true)
          }
          Some(_) => (false, Some("invalid_code".to_string()), true),
          None => (false, Some("not_discoverable".to_string()), false),
        }
      }
    } else {
      (false, Some("runtime_lock_error".to_string()), false)
    };

    if refresh_mdns {
      let _ = refresh_mdns_advertisement(&self.state, &self.mdns_advertiser);
    }

    Ok(crate::sync::types::PairAckResponse {
      request_id: req.request_id,
      accepted,
      host_device_id: local_device_id(),
      reason,
    })
  }

  pub fn handle_history_sync_push(
    &self,
    req: crate::sync::types::HistorySyncPushRequest,
  ) -> Result<crate::sync::types::HistorySyncAckResponse, String> {
    if !matches_local_target_device(&req.target_device_id) {
      return Err("Mismatch target_device_id".to_string());
    }

    let is_enabled = self.state.lock().map(|s| s.enabled).unwrap_or(false);
    if !is_enabled {
      return Ok(crate::sync::types::HistorySyncAckResponse {
        request_id: req.request_id,
        host_device_id: local_device_id(),
        accepted: false,
        applied_count: 0,
        last_applied_seq: 0,
        reason: Some("sync_off".to_string()),
      });
    }

    let trusted = peer_is_trusted(&req.source_device_id).unwrap_or(false);
    if !trusted {
      return Ok(crate::sync::types::HistorySyncAckResponse {
        request_id: req.request_id,
        host_device_id: local_device_id(),
        accepted: false,
        applied_count: 0,
        last_applied_seq: 0,
        reason: Some("untrusted_peer".to_string()),
      });
    }

    let apply_result: Result<(usize, i64), String> = (|| {
      let mut conn = establish_pool_db_connection();
      let mut remote_apply = enable_remote_apply_context(&mut conn).map_err(|e| e.to_string())?;
      apply_history_changes(remote_apply.conn_mut(), &req.changes)
    })();

    match apply_result {
      Ok((applied_count, last_applied_seq)) => {
        let _ = update_peer_last_applied_seq(&req.source_device_id, last_applied_seq);
        Ok(crate::sync::types::HistorySyncAckResponse {
          request_id: req.request_id,
          host_device_id: local_device_id(),
          accepted: true,
          applied_count,
          last_applied_seq,
          reason: None,
        })
      }
      Err(error) => Ok(crate::sync::types::HistorySyncAckResponse {
        request_id: req.request_id,
        host_device_id: local_device_id(),
        accepted: false,
        applied_count: 0,
        last_applied_seq: 0,
        reason: Some(error),
      }),
    }
  }

  fn start_history_auto_sync_worker(&self) -> Result<(), String> {
    if self.is_history_auto_sync_worker_running() {
      return Ok(());
    }

    self.auto_sync_stop_signal.store(false, Ordering::SeqCst);
    let state = Arc::clone(&self.state);
    let stop_signal = Arc::clone(&self.auto_sync_stop_signal);

    let handle = std::thread::Builder::new()
      .name("pastebar-sync-history-auto".to_string())
      .spawn(move || {
        run_history_auto_sync_loop(state, stop_signal);
      })
      .map_err(|e| format!("Failed to start auto history sync thread: {}", e))?;

    let media_stop_signal = Arc::clone(&self.auto_sync_stop_signal);
    let media_root = crate::db::get_clip_images_dir();
    crate::sync::media::start_fetch_queue_worker(media_stop_signal, media_root);

    let mut worker_guard = self
      .auto_sync_worker
      .lock()
      .map_err(|_| "Pairing auto sync worker lock poisoned".to_string())?;
    *worker_guard = Some(handle);
    Ok(())
  }

  fn stop_history_auto_sync_worker(&self) {
    self.auto_sync_stop_signal.store(true, Ordering::SeqCst);
    if let Ok(mut worker_guard) = self.auto_sync_worker.lock() {
      if let Some(handle) = worker_guard.take() {
        let _ = handle.join();
      }
    }
  }

  fn is_history_auto_sync_worker_running(&self) -> bool {
    self
      .auto_sync_worker
      .lock()
      .map(|guard| guard.is_some())
      .unwrap_or(false)
  }

  fn set_last_error(&self, message: String) -> Result<(), String> {
    let mut state = self
      .state
      .lock()
      .map_err(|_| "Pairing state lock poisoned".to_string())?;
    state.last_error = Some(message);
    Ok(())
  }
}

async fn sync_history_now_internal(state: &Arc<Mutex<PairingState>>) -> Result<usize, String> {
  let started_at = now_ms();
  let min_updated_at_ms = started_at - HISTORY_SYNC_WINDOW_MS;
  {
    let state_guard = state
      .lock()
      .map_err(|_| "Pairing state lock poisoned".to_string())?;
    if !state_guard.enabled {
      return Err("Sync must be enabled before history sync.".to_string());
    }
  }

  let local_device = local_device_id();
  let peers = trusted_peers_with_cursor()?;
  if peers.is_empty() {
    set_history_sync_diagnostics(
      state,
      started_at,
      "No trusted peers. Pair another device first.",
      0,
    );
    return Ok(0);
  }

  // First-run migration aid: if history outbox is empty, seed it from existing local history.
  if let Ok((latest_seq, total_rows, _)) = history_outbox_stats_since(0, min_updated_at_ms) {
    if total_rows == 0 {
      let mut conn = establish_pool_db_connection();
      match backfill_history_outbox_from_existing(
        &mut conn,
        HISTORY_BACKFILL_LIMIT,
        min_updated_at_ms,
      ) {
        Ok(count) if count > 0 => {
          let _ = sync_history_to_peer(
            &local_device,
            &peers[0].peer_device_id,
            0,
            min_updated_at_ms,
          ).await;
          return Ok(count);
        }
        Err(error) => {
          debug_output(|| {
            println!(
              "[sync-history] failed to seed history outbox from clipboard_history: {}",
              error
            );
          });
        }
        _ => {}
      }
    }
  }

  let mut synced_changes = 0usize;
  let mut peer_debug_details: Vec<String> = Vec::new();
  for peer in peers {
    let (latest_seq, total_rows, pending_rows) =
      history_outbox_stats_since(peer.last_acked_seq, min_updated_at_ms)
      .unwrap_or((0, 0, 0));
    debug_output(|| {
      println!(
        "[sync-history] peer={} last_acked_seq={} latest_history_seq={} total_history_rows={} pending_rows={} min_updated_at={}",
        peer.peer_device_id,
        peer.last_acked_seq,
        latest_seq,
        total_rows,
        pending_rows,
        min_updated_at_ms
      );
    });
    peer_debug_details.push(format!(
      "peer={} acked={} latest={} pending={} total={}",
      peer.peer_device_id, peer.last_acked_seq, latest_seq, pending_rows, total_rows
    ));

    let applied = match sync_history_to_peer(
      &local_device,
      &peer.peer_device_id,
      peer.last_acked_seq,
      min_updated_at_ms,
    ).await {
      Ok(applied) => applied,
      Err(error) => {
        set_history_sync_diagnostics(
          state,
          started_at,
          &format!("Failed for peer {}: {}", peer.peer_device_id, error),
          synced_changes,
        );
        return Err(error);
      }
    };
    synced_changes += applied;
  }

  let result = if synced_changes == 0 {
    if peer_debug_details.is_empty() {
      "History sync completed. No new changes to send.".to_string()
    } else {
      format!(
        "History sync completed. No new changes to send in the last hour. {}",
        peer_debug_details.join(" | ")
      )
    }
  } else {
    format!("History sync completed. Sent {} change(s).", synced_changes)
  };
  set_history_sync_diagnostics(state, started_at, &result, synced_changes);
  Ok(synced_changes)
}

fn history_outbox_stats_since(since_seq: i64, min_updated_at_ms: i64) -> Result<(i64, i64, i64), String> {
  let mut conn = establish_pool_db_connection();
  let rows: Vec<HistoryOutboxStatsRow> = diesel::sql_query(
    "SELECT
       COALESCE(MAX(CAST(seq AS BIGINT)), 0) AS latest_seq,
       CAST(COUNT(*) AS BIGINT) AS total_rows,
       COALESCE(
         CAST(SUM(CASE WHEN CAST(seq AS BIGINT) > ? THEN 1 ELSE 0 END) AS BIGINT),
         0
       ) AS pending_rows
     FROM sync_changes
     WHERE table_name = 'clipboard_history'
       AND updated_at >= ?",
  )
  .bind::<BigInt, _>(since_seq)
  .bind::<BigInt, _>(min_updated_at_ms)
  .load(&mut conn)
  .map_err(|e| e.to_string())?;

  let row = rows
    .first()
    .ok_or_else(|| "History outbox stats query returned no rows".to_string())?;
  Ok((row.latest_seq, row.total_rows, row.pending_rows))
}

fn set_history_sync_diagnostics(
  state: &Arc<Mutex<PairingState>>,
  at_ms: i64,
  result: &str,
  sent_changes: usize,
) {
  if let Ok(mut state_guard) = state.lock() {
    state_guard.history_last_sync_at_ms = Some(at_ms);
    state_guard.history_last_sync_result = Some(result.to_string());
    state_guard.history_last_sync_sent_changes = sent_changes;
  }
  debug_output(|| {
    println!(
      "[sync-history] at={} result=\"{}\" sent_changes={}",
      at_ms, result, sent_changes
    );
  });
}

fn run_history_auto_sync_loop(state: Arc<Mutex<PairingState>>, stop_signal: Arc<AtomicBool>) {
  let rt = match tokio::runtime::Builder::new_current_thread().enable_all().build() {
    Ok(rt) => rt,
    Err(e) => {
      eprintln!("Failed to start Tokio runtime for auto sync loop: {}", e);
      return;
    }
  };

  while !stop_signal.load(Ordering::SeqCst) {
    let should_run = state
      .lock()
      .map(|runtime_state| runtime_state.enabled && runtime_state.history_auto_sync_enabled)
      .unwrap_or(false);

    if should_run {
      match rt.block_on(sync_history_now_internal(&state)) {
        Ok(_) => {
          if let Ok(mut runtime_state) = state.lock() {
            runtime_state.last_error = None;
          }
        }
        Err(error) => {
          if let Ok(mut runtime_state) = state.lock() {
            runtime_state.last_error = Some(error);
          }
        }
      }
    }

    std::thread::sleep(Duration::from_millis(HISTORY_AUTO_SYNC_INTERVAL_MS));
  }
}

fn should_ignore_rejection_for_self_not_discoverable(
  accepted: bool,
  host_device_id: &str,
  requester_device_id: &str,
  reason: Option<&str>,
) -> bool {
  !accepted && host_device_id == requester_device_id && matches!(reason, Some("not_discoverable"))
}

fn humanize_rejection_reason(reason: &str) -> String {
  match reason {
    "not_discoverable" => {
      "Target device is not discoverable. Generate a new 6-digit code and retry.".to_string()
    }
    "invalid_code" => "The 6-digit code is invalid for the target device.".to_string(),
    "sync_off" => "Target device has sync turned off.".to_string(),
    "database_error" => "Target device failed to save pairing state.".to_string(),
    "runtime_lock_error" => "Target device pairing runtime is busy. Retry.".to_string(),
    other => other.to_string(),
  }
}

fn expire_discoverable_window(runtime_state: &mut PairingState, now: i64) {
  if let Some(expires_at) = runtime_state.discoverable_until_ms {
    if now >= expires_at {
      runtime_state.pair_code = None;
      runtime_state.discoverable_until_ms = None;
    }
  }
}



fn scan_mdns_devices(
  requester_device_id: &str,
  mdns_advertiser: &Arc<Mutex<Option<MdnsAdvertiser>>>,
) -> Vec<PairingDiscoveredDevice> {
  let mut discovered: BTreeMap<String, PairingDiscoveredDevice> = BTreeMap::new();
  let receiver = {
    let mut advertiser_guard = match mdns_advertiser.lock() {
      Ok(guard) => guard,
      Err(_) => return Vec::new(),
    };
    if advertiser_guard.is_none() {
      let daemon = match ServiceDaemon::new() {
        Ok(daemon) => daemon,
        Err(_) => return Vec::new(),
      };
      *advertiser_guard = Some(MdnsAdvertiser {
        daemon,
        service_fullname: None,
      });
    }
    let Some(advertiser) = advertiser_guard.as_mut() else {
      return Vec::new();
    };
    match advertiser.daemon.browse(MDNS_SERVICE_TYPE) {
      Ok(receiver) => receiver,
      Err(_) => return Vec::new(),
    }
  };

  let mut deadline = now_ms() + (DISCOVERY_WAIT_PER_ATTEMPT_MS * 2);
  while now_ms() < deadline {
    let event = match receiver.recv_timeout(Duration::from_millis(SOCKET_POLL_TIMEOUT_MS)) {
      Ok(event) => event,
      Err(_) => continue,
    };

    let info = match event {
      ServiceEvent::ServiceFound(_, _) => {
        deadline = deadline.max(now_ms() + SOCKET_POLL_TIMEOUT_MS as i64);
        continue;
      }
      ServiceEvent::ServiceResolved(info) => info,
      _ => continue,
    };

    let props = info.get_properties();
    let host_device_id = mdns_txt_value(props, "device_id")
      .or_else(|| mdns_txt_value(props, "app_id"))
      .unwrap_or_else(|| {
        info
          .get_fullname()
          .trim_end_matches(MDNS_SERVICE_TYPE)
          .trim_end_matches('.')
          .to_string()
      });

    if host_device_id.is_empty() || host_device_id == requester_device_id {
      continue;
    }

    let discoverable = matches!(mdns_txt_value(props, "discoverable").as_deref(), Some("1"));
    let sync_enabled = !matches!(mdns_txt_value(props, "sync_enabled").as_deref(), Some("0"));
    let source_addr = info
      .get_addresses()
      .iter()
      .find(|ip| !ip.is_loopback())
      .map(|ip| format!("{}:{}", ip, info.get_port()))
      .unwrap_or_else(|| format!("mdns:{}", info.get_port()));

    discovered.insert(
      host_device_id.clone(),
      PairingDiscoveredDevice {
        host_device_id,
        source_addr,
        discoverable,
        sync_enabled,
      },
    );
  }

  discovered.into_values().collect()
}

fn mdns_txt_value(props: &mdns_sd::TxtProperties, key: &str) -> Option<String> {
  props
    .iter()
    .find(|entry| entry.key() == key)
    .and_then(|entry| entry.val())
    .map(|value| String::from_utf8_lossy(value).to_string())
}

fn refresh_mdns_advertisement(
  state: &Arc<Mutex<PairingState>>,
  mdns_advertiser: &Arc<Mutex<Option<MdnsAdvertiser>>>,
) -> Result<(), String> {
  let (enabled, discoverable) = {
    let state_guard = state
      .lock()
      .map_err(|_| "Pairing state lock poisoned".to_string())?;
    (
      state_guard.enabled,
      state_guard.enabled && state_guard.pair_code.is_some(),
    )
  };

  let mut advertiser_guard = mdns_advertiser
    .lock()
    .map_err(|_| "mDNS advertiser lock poisoned".to_string())?;

  if !enabled {
    if let Some(mut existing) = advertiser_guard.take() {
      if let Some(service_fullname) = existing.service_fullname.take() {
        let _ = existing.daemon.unregister(&service_fullname);
      }
      let _ = existing.daemon.shutdown();
    }
    return Ok(());
  }

  if advertiser_guard.is_none() {
    let daemon =
      ServiceDaemon::new().map_err(|e| format!("Failed to create mDNS daemon: {}", e))?;
    *advertiser_guard = Some(MdnsAdvertiser {
      daemon,
      service_fullname: None,
    });
  }
  let Some(advertiser) = advertiser_guard.as_mut() else {
    return Err("mDNS advertiser not available".to_string());
  };
  if let Some(previous_fullname) = advertiser.service_fullname.take() {
    let _ = advertiser.daemon.unregister(&previous_fullname);
  }

  let mut properties = HashMap::new();
  properties.insert("app".to_string(), "pastebar".to_string());
  properties.insert("proto".to_string(), "sync".to_string());
  properties.insert("device_id".to_string(), local_device_id());
  properties.insert(
    "discoverable".to_string(),
    if discoverable { "1" } else { "0" }.to_string(),
  );
  properties.insert("sync_enabled".to_string(), "1".to_string());

  let host_name = format!("{}.local", local_device_id());
  let service_info = ServiceInfo::new(
    MDNS_SERVICE_TYPE,
    &local_device_id(),
    &host_name,
    IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0)),
    PAIRING_PORT,
    Some(properties),
  )
  .map_err(|e| format!("Failed to build mDNS service info: {}", e))?
  .enable_addr_auto();

  advertiser
    .daemon
    .register(service_info)
    .map_err(|e| format!("Failed to register mDNS service: {}", e))?;
  advertiser.service_fullname = Some(mdns_service_fullname(&local_device_id()));
  Ok(())
}

fn mdns_service_fullname(device_id: &str) -> String {
  format!("{}.{}", device_id, MDNS_SERVICE_TYPE)
}

fn trusted_peers_with_cursor() -> Result<Vec<PeerSyncCursorRow>, String> {
  let mut conn = establish_pool_db_connection();
  diesel::sql_query(
    "SELECT peer_device_id, last_acked_seq
     FROM sync_peer_cursor
     WHERE is_trusted = 1 AND is_stale = 0
     ORDER BY updated_at DESC",
  )
  .load(&mut conn)
  .map_err(|e| e.to_string())
}

async fn sync_history_to_peer(
  local_device: &str,
  peer_device_id: &str,
  mut since_seq: i64,
  min_updated_at_ms: i64,
) -> Result<usize, String> {
  let mut total_applied = 0usize;

  loop {
    let raw_changes = {
      let mut conn = establish_pool_db_connection();
      load_history_changes_since(
        &mut conn,
        since_seq,
        HISTORY_SYNC_BATCH_LIMIT,
        min_updated_at_ms,
      )?
    };
    if raw_changes.is_empty() {
      return Ok(total_applied);
    }
    let loaded_max_seq = raw_changes.last().map(|change| change.seq).unwrap_or(since_seq);
    let skipped_peer_echo = raw_changes
      .iter()
      .filter(|change| change.source_device_id == peer_device_id)
      .count();
    let changes: Vec<HistorySyncChange> = raw_changes
      .into_iter()
      .filter(|change| change.source_device_id != peer_device_id)
      .collect();
      
    if changes.is_empty() {
      since_seq = loaded_max_seq;
      update_peer_acked_seq(peer_device_id, since_seq)?;
      continue;
    }

    let request_id = nanoid::nanoid!(12);
    let packet = crate::sync::types::HistorySyncPushRequest {
      request_id: request_id.clone(),
      source_device_id: local_device.to_string(),
      target_device_id: peer_device_id.to_string(),
      changes: changes.clone(),
    };

    let peer_ip_lookup = {
      let ips = crate::sync::discovery::get_peer_ips().read().unwrap();
      ips.get(peer_device_id).cloned()
    };

    let target_addr = match peer_ip_lookup {
      Some(addr) => addr,
      None => return Err(format!("Peer {} IP not found via mDNS.", peer_device_id)),
    };

    let payload = serde_json::to_vec(&packet)
      .map_err(|e| format!("Failed to encode history sync: {}", e))?;

    let url = format!("http://{}/sync/history", target_addr);

    let client = reqwest::Client::builder()
      .timeout(Duration::from_secs(10))
      .build()
      .map_err(|e| e.to_string())?;

    let resp = client.post(&url)
      .header("Content-Type", "application/json")
      .body(payload)
      .send()
      .await
      .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
      return Err(format!("HTTP error {}", resp.status()));
    }

    let ack_packet = resp.json::<crate::sync::types::HistorySyncAckResponse>().await.map_err(|e| e.to_string())?;

    let crate::sync::types::HistorySyncAckResponse {
      request_id: ack_request_id,
      host_device_id,
      accepted,
      applied_count,
      last_applied_seq,
      reason,
    } = ack_packet;

    if ack_request_id != request_id {
      return Err("Mismatched request ID in ACK".to_string());
    }

    if !accepted {
      let message = reason.unwrap_or_else(|| "history_sync_rejected".to_string());
      return Err(message);
    }

    let acked_seq = last_applied_seq.max(since_seq);
    update_peer_acked_seq(peer_device_id, acked_seq)?;
    since_seq = acked_seq;
    total_applied += applied_count;
  }
}


fn update_peer_acked_seq(peer_device_id: &str, seq: i64) -> Result<(), String> {
  let now = now_ms();
  let mut conn = establish_pool_db_connection();
  diesel::sql_query(
    "UPDATE sync_peer_cursor
     SET last_acked_seq = CASE
         WHEN last_acked_seq > ? THEN last_acked_seq
         ELSE ?
       END,
       last_seen_at = ?,
       updated_at = ?
     WHERE peer_device_id = ?",
  )
  .bind::<BigInt, _>(seq)
  .bind::<BigInt, _>(seq)
  .bind::<BigInt, _>(now)
  .bind::<BigInt, _>(now)
  .bind::<Text, _>(peer_device_id.to_string())
  .execute(&mut conn)
  .map_err(|e| e.to_string())?;
  Ok(())
}

pub fn peer_is_trusted(peer_device_id: &str) -> Result<bool, String> {
  let mut conn = establish_pool_db_connection();
  let rows: Vec<PeerTrustRow> = diesel::sql_query(
    "SELECT is_trusted
     FROM sync_peer_cursor
     WHERE peer_device_id = ?
     LIMIT 1",
  )
  .bind::<Text, _>(peer_device_id.to_string())
  .load(&mut conn)
  .map_err(|e| e.to_string())?;

  Ok(rows.first().map(|row| row.is_trusted).unwrap_or(false))
}

fn matches_local_target_device(target_device_id: &str) -> bool {
  let local = local_device_id();
  if target_device_id == local {
    return true;
  }

  let mut conn = establish_pool_db_connection();
  let rows: Vec<SyncMetaDeviceRow> = diesel::sql_query(
    "SELECT device_id
     FROM sync_meta
     WHERE device_id = ?
     LIMIT 1",
  )
  .bind::<Text, _>(target_device_id.to_string())
  .load(&mut conn)
  .unwrap_or_default();

  let matched = rows.iter().any(|row| row.device_id == target_device_id);
  if matched {
    debug_output(|| {
      println!(
        "[sync-net] accepted legacy local target_id={} current_local_device_id={}",
        target_device_id, local
      );
    });
  }
  matched
}

fn update_peer_last_applied_seq(peer_device_id: &str, seq: i64) -> Result<(), String> {
  let now = now_ms();
  let mut conn = establish_pool_db_connection();
  diesel::sql_query(
    "INSERT INTO sync_peer_cursor (
       peer_device_id, last_acked_seq, last_applied_seq, is_trusted, is_stale, last_seen_at, created_at, updated_at
     ) VALUES (
       ?, 0, ?, 1, 0, ?, ?, ?
     )
     ON CONFLICT(peer_device_id) DO UPDATE SET
       last_applied_seq = CASE
         WHEN sync_peer_cursor.last_applied_seq > excluded.last_applied_seq
           THEN sync_peer_cursor.last_applied_seq
           ELSE excluded.last_applied_seq
       END,
       is_stale = 0,
       last_seen_at = excluded.last_seen_at,
       updated_at = excluded.updated_at",
  )
  .bind::<Text, _>(peer_device_id.to_string())
  .bind::<BigInt, _>(seq)
  .bind::<BigInt, _>(now)
  .bind::<BigInt, _>(now)
  .bind::<BigInt, _>(now)
  .execute(&mut conn)
  .map_err(|e| e.to_string())?;
  Ok(())
}

pub fn local_device_id() -> String {
  LOCAL_DEVICE_ID.clone()
}

fn ipv4_broadcast_from_ip_and_netmask(ip: Ipv4Addr, netmask: Ipv4Addr) -> Ipv4Addr {
  let ip_octets = ip.octets();
  let nm_octets = netmask.octets();
  let mut b_octets = [0u8; 4];
  for i in 0..4 {
    b_octets[i] = ip_octets[i] | !nm_octets[i];
  }
  Ipv4Addr::from(b_octets)
}

fn ipv4_subnet_hosts(ip: Ipv4Addr, netmask: Ipv4Addr) -> Vec<Ipv4Addr> {
  let ip_u32 = u32::from_be_bytes(ip.octets());
  let nm_u32 = u32::from_be_bytes(netmask.octets());
  let network_u32 = ip_u32 & nm_u32;
  let broadcast_u32 = network_u32 | !nm_u32;

  let mut hosts = Vec::new();
  if network_u32 + 1 < broadcast_u32 {
    let start = network_u32 + 1;
    let end = broadcast_u32;
    for host_u32 in start..end {
      hosts.push(Ipv4Addr::from(host_u32));
    }
  }
  hosts
}

fn resolve_local_device_id() -> String {
  match mid::get("PasteBarApp") {
    Ok(id) => {
      let truncated: String = id.chars().take(24).collect();
      if truncated.is_empty() {
        format!("device-{}", nanoid::nanoid!(10))
      } else {
        truncated
      }
    }
    Err(_) => format!("device-{}", nanoid::nanoid!(10)),
  }
}

