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
  pub listener_running: bool,
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
  worker: Arc<Mutex<Option<JoinHandle<()>>>>,
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
      worker: Arc::new(Mutex::new(None)),
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
      self.start_listener()?;
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
      self.stop_listener();
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

  pub fn join_with_code(
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

    let socket =
      UdpSocket::bind("0.0.0.0:0").map_err(|e| format!("Failed to open pairing socket: {}", e))?;
    socket
      .set_broadcast(true)
      .map_err(|e| format!("Failed to enable UDP broadcast: {}", e))?;
    socket
      .set_read_timeout(Some(Duration::from_millis(SOCKET_POLL_TIMEOUT_MS)))
      .map_err(|e| format!("Failed to configure pairing socket timeout: {}", e))?;

    let request_id = nanoid::nanoid!(12);
    let request_packet = PairingPacket::PairRequest {
      request_id: request_id.clone(),
      code: sanitized_code.to_string(),
      requester_device_id: requester_device_id.to_string(),
    };
    let payload = serde_json::to_vec(&request_packet)
      .map_err(|e| format!("Failed to serialize pairing request: {}", e))?;

    let discovery_targets = discovery_target_addresses();
    let mut last_rejection: Option<String> = None;

    for _ in 0..JOIN_ATTEMPTS {
      for target in &discovery_targets {
        let _ = socket.send_to(&payload, *target);
      }

      let attempt_deadline = now_ms() + JOIN_WAIT_PER_ATTEMPT_MS;
      while now_ms() < attempt_deadline {
        let mut buffer = [0u8; 4096];
        let recv = socket.recv_from(&mut buffer);
        let (len, _src) = match recv {
          Ok(result) => result,
          Err(_) => continue,
        };

        let packet = match serde_json::from_slice::<PairingPacket>(&buffer[..len]) {
          Ok(packet) => packet,
          Err(_) => continue,
        };

        let PairingPacket::PairAck {
          request_id: ack_request_id,
          accepted,
          host_device_id,
          reason,
        } = packet
        else {
          continue;
        };

        if ack_request_id != request_id {
          continue;
        }

        if should_ignore_rejection_for_self_not_discoverable(
          accepted,
          &host_device_id,
          requester_device_id,
          reason.as_deref(),
        ) {
          continue;
        }

        if accepted {
          self.clear_last_error()?;
          return Ok(PairingJoinResult { host_device_id });
        }

        let rejection_reason = reason.unwrap_or_else(|| "pairing_rejected".to_string());
        last_rejection = Some(humanize_rejection_reason(&rejection_reason));
      }
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

    let socket = UdpSocket::bind("0.0.0.0:0")
      .map_err(|e| format!("Failed to open discovery socket: {}", e))?;
    socket
      .set_broadcast(true)
      .map_err(|e| format!("Failed to enable UDP broadcast: {}", e))?;
    socket
      .set_read_timeout(Some(Duration::from_millis(SOCKET_POLL_TIMEOUT_MS)))
      .map_err(|e| format!("Failed to configure discovery socket timeout: {}", e))?;

    let request_id = nanoid::nanoid!(12);
    let probe_packet = PairingPacket::DiscoveryProbe {
      request_id: request_id.clone(),
      requester_device_id: requester_device_id.to_string(),
    };
    let payload = serde_json::to_vec(&probe_packet)
      .map_err(|e| format!("Failed to serialize discovery request: {}", e))?;

    let discovery_targets = discovery_target_addresses();
    let mut discovered: BTreeMap<String, PairingDiscoveredDevice> = BTreeMap::new();
    for mdns_device in scan_mdns_devices(requester_device_id, &self.mdns_advertiser) {
      discovered.insert(mdns_device.host_device_id.clone(), mdns_device);
    }

    for _ in 0..DISCOVERY_ATTEMPTS {
      for target in &discovery_targets {
        let _ = socket.send_to(&payload, *target);
      }

      let attempt_deadline = now_ms() + DISCOVERY_WAIT_PER_ATTEMPT_MS;
      while now_ms() < attempt_deadline {
        let mut buffer = [0u8; 4096];
        let recv = socket.recv_from(&mut buffer);
        let (len, source_addr) = match recv {
          Ok(result) => result,
          Err(_) => continue,
        };

        let packet = match serde_json::from_slice::<PairingPacket>(&buffer[..len]) {
          Ok(packet) => packet,
          Err(_) => continue,
        };

        let PairingPacket::DiscoveryAck {
          request_id: ack_request_id,
          host_device_id,
          discoverable,
          sync_enabled,
        } = packet
        else {
          continue;
        };

        if ack_request_id != request_id {
          continue;
        }

        discovered.insert(
          host_device_id.clone(),
          PairingDiscoveredDevice {
            host_device_id,
            source_addr: source_addr.to_string(),
            discoverable,
            sync_enabled,
          },
        );
      }
    }

    let mut devices: Vec<PairingDiscoveredDevice> = discovered.into_values().collect();
    devices.sort_by(|a, b| {
      b.discoverable
        .cmp(&a.discoverable)
        .then_with(|| a.host_device_id.cmp(&b.host_device_id))
    });
    Ok(devices)
  }

  pub fn sync_history_now(&self) -> Result<usize, String> {
    sync_history_now_internal(&self.state)
  }

  pub fn ping_trusted_peers(
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

    let socket =
      UdpSocket::bind("0.0.0.0:0").map_err(|e| format!("Failed to open ping socket: {}", e))?;
    socket
      .set_broadcast(true)
      .map_err(|e| format!("Failed to enable UDP broadcast for ping: {}", e))?;
    socket
      .set_read_timeout(Some(Duration::from_millis(SOCKET_POLL_TIMEOUT_MS)))
      .map_err(|e| format!("Failed to set ping socket timeout: {}", e))?;

    let targets = discovery_target_addresses();
    let mut results: Vec<PairingPingResult> = Vec::new();

    for peer in peers {
      let ping_started_at = now_ms();
      let request_id = nanoid::nanoid!(12);
      let payload_id = nanoid::nanoid!(10);
      let payload_time = now_ms();
      let ping_packet = PairingPacket::PingJson {
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
      let payload = serde_json::to_vec(&ping_packet)
        .map_err(|e| format!("Failed to encode ping payload: {}", e))?;

      let mut matched: Option<PairingPingResult> = None;
      for _ in 0..PING_ATTEMPTS {
        for target in &targets {
          let _ = socket.send_to(&payload, *target);
        }

        let deadline = now_ms() + PING_WAIT_PER_ATTEMPT_MS;
        while now_ms() < deadline {
          let mut buffer = [0u8; 4096];
          let recv = socket.recv_from(&mut buffer);
          let (len, source_addr) = match recv {
            Ok(result) => result,
            Err(_) => continue,
          };

          let packet = match serde_json::from_slice::<PairingPacket>(&buffer[..len]) {
            Ok(packet) => packet,
            Err(_) => continue,
          };

          let PairingPacket::PongJson {
            request_id: ack_request_id,
            source_device_id,
            target_device_id,
            id,
            time,
            pong,
          } = packet
          else {
            continue;
          };

          if ack_request_id != request_id
            || target_device_id != requester_device_id
            || id != payload_id
          {
            continue;
          }
          if source_device_id != peer.peer_device_id {
            debug_output(|| {
              println!(
                "[sync-ping] peer={} payload_id={} pong_source_device_id_mismatch expected={} actual={}",
                peer.peer_device_id, payload_id, peer.peer_device_id, source_device_id
              );
            });
          }

          let round_trip_ms = (now_ms() - ping_started_at).max(0);
          let response_json = json!({
            "id": id,
            "time": time,
            "pong": pong
          })
          .to_string();
          matched = Some(PairingPingResult {
            peer_device_id: peer.peer_device_id.clone(),
            source_addr: Some(source_addr.to_string()),
            payload_id: payload_id.clone(),
            payload_time,
            pong,
            round_trip_ms: Some(round_trip_ms),
            request_json: request_json.clone(),
            response_json: Some(response_json),
            error: None,
          });
          break;
        }

        if matched.is_some() {
          break;
        }
      }

      let result = matched.unwrap_or_else(|| PairingPingResult {
        peer_device_id: peer.peer_device_id.clone(),
        source_addr: None,
        payload_id: payload_id.clone(),
        payload_time,
        pong: false,
        round_trip_ms: None,
        request_json: request_json.clone(),
        response_json: None,
        error: Some("timeout_no_pong".to_string()),
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
      listener_running: self.is_listener_running(),
      last_error: state.last_error.clone(),
    })
  }

  fn start_listener(&self) -> Result<(), String> {
    if self.is_listener_running() {
      return Ok(());
    }

    let socket = UdpSocket::bind(("0.0.0.0", PAIRING_PORT)).map_err(|e| {
      format!(
        "Failed to bind pairing listener on port {}: {}",
        PAIRING_PORT, e
      )
    })?;
    socket
      .set_broadcast(true)
      .map_err(|e| format!("Failed to enable listener broadcast mode: {}", e))?;
    socket
      .set_read_timeout(Some(Duration::from_millis(SOCKET_POLL_TIMEOUT_MS)))
      .map_err(|e| format!("Failed to set listener timeout: {}", e))?;

    self.stop_signal.store(false, Ordering::SeqCst);
    let state = Arc::clone(&self.state);
    let stop_signal = Arc::clone(&self.stop_signal);
    let mdns_advertiser = Arc::clone(&self.mdns_advertiser);

    let handle = std::thread::Builder::new()
      .name("pastebar-sync-pairing-listener".to_string())
      .spawn(move || {
        run_listener_loop(socket, state, stop_signal, mdns_advertiser);
      })
      .map_err(|e| format!("Failed to start pairing listener thread: {}", e))?;

    let mut worker_guard = self
      .worker
      .lock()
      .map_err(|_| "Pairing worker lock poisoned".to_string())?;
    *worker_guard = Some(handle);
    Ok(())
  }

  fn stop_listener(&self) {
    self.stop_signal.store(true, Ordering::SeqCst);
    if let Ok(mut worker_guard) = self.worker.lock() {
      if let Some(handle) = worker_guard.take() {
        let _ = handle.join();
      }
    }
  }

  fn is_listener_running(&self) -> bool {
    self
      .worker
      .lock()
      .map(|guard| guard.is_some())
      .unwrap_or(false)
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

fn sync_history_now_internal(state: &Arc<Mutex<PairingState>>) -> Result<usize, String> {
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
        Ok(inserted) => {
          debug_output(|| {
            println!(
              "[sync-history] seeded history outbox from clipboard_history inserted={} latest_before={} min_updated_at={}",
              inserted, latest_seq, min_updated_at_ms
            );
          });
        }
        Err(error) => {
          debug_output(|| {
            println!(
              "[sync-history] failed to seed history outbox from clipboard_history: {}",
              error
            );
          });
        }
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
    ) {
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
  while !stop_signal.load(Ordering::SeqCst) {
    let should_run = state
      .lock()
      .map(|runtime_state| runtime_state.enabled && runtime_state.history_auto_sync_enabled)
      .unwrap_or(false);

    if should_run {
      match sync_history_now_internal(&state) {
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

fn discovery_target_addresses() -> Vec<SocketAddr> {
  let mut targets = BTreeSet::new();
  targets.insert(SocketAddr::from(([255, 255, 255, 255], PAIRING_PORT)));
  targets.insert(SocketAddr::from(([127, 0, 0, 1], PAIRING_PORT)));

  if let Ok(ifaces) = get_if_addrs() {
    for iface in ifaces {
      let IfAddr::V4(v4) = iface.addr else {
        continue;
      };

      if v4.ip.is_loopback() {
        continue;
      }

      let directed_broadcast = v4
        .broadcast
        .unwrap_or_else(|| ipv4_broadcast_from_ip_and_netmask(v4.ip, v4.netmask));
      targets.insert(SocketAddr::from((directed_broadcast, PAIRING_PORT)));

      for host in ipv4_subnet_hosts(v4.ip, v4.netmask)
        .into_iter()
        .take(MAX_SUBNET_SWEEP_HOSTS_PER_INTERFACE)
      {
        targets.insert(SocketAddr::from((host, PAIRING_PORT)));
      }
    }
  }

  targets.into_iter().collect()
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

fn sync_history_to_peer(
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
      debug_output(|| {
        println!(
          "[sync-history] peer={} skipped peer-origin rows={} advanced_cursor_to_seq={}",
          peer_device_id, skipped_peer_echo, since_seq
        );
      });
      continue;
    }
    debug_output(|| {
      println!(
        "[sync-history] peer={} since_seq={} loaded_changes={} skipped_peer_echo={} outgoing_changes={}",
        peer_device_id,
        since_seq,
        changes.len() + skipped_peer_echo,
        skipped_peer_echo,
        changes.len()
      );
    });

    let batches =
      split_history_changes_for_udp(local_device, peer_device_id, &changes, HISTORY_SYNC_MAX_PACKET_BYTES)?;
    debug_output(|| {
      println!(
        "[sync-history] peer={} batches={} max_packet_bytes={}",
        peer_device_id,
        batches.len(),
        HISTORY_SYNC_MAX_PACKET_BYTES
      );
    });

    let socket = UdpSocket::bind("0.0.0.0:0")
      .map_err(|e| format!("Failed to open history sync socket: {}", e))?;
    socket
      .set_broadcast(true)
      .map_err(|e| format!("Failed to enable UDP broadcast for history sync: {}", e))?;
    socket
      .set_read_timeout(Some(Duration::from_millis(SOCKET_POLL_TIMEOUT_MS)))
      .map_err(|e| format!("Failed to set history sync socket timeout: {}", e))?;

    let targets = discovery_target_addresses();
    for batch in batches {
      let request_id = nanoid::nanoid!(12);
      let payload = encode_history_sync_push(local_device, peer_device_id, &request_id, &batch)?;
      debug_output(|| {
        println!(
          "[sync-history] peer={} request_id={} batch_changes={} payload_bytes={}",
          peer_device_id,
          request_id,
          batch.len(),
          payload.len()
        );
      });
      let mut received_ack = false;
      let mut send_errors = 0usize;

      for _ in 0..HISTORY_SYNC_ATTEMPTS {
        for target in &targets {
          if socket.send_to(&payload, *target).is_err() {
            send_errors += 1;
          }
        }

        let deadline = now_ms() + HISTORY_SYNC_WAIT_PER_ATTEMPT_MS;
        while now_ms() < deadline {
          let mut buffer = [0u8; 65535];
          let recv = socket.recv_from(&mut buffer);
          let (len, _source_addr) = match recv {
            Ok(result) => result,
            Err(_) => continue,
          };

          let packet = match serde_json::from_slice::<PairingPacket>(&buffer[..len]) {
            Ok(packet) => packet,
            Err(_) => continue,
          };

          let PairingPacket::HistorySyncAck {
            request_id: ack_request_id,
            host_device_id,
            accepted,
            applied_count,
            last_applied_seq,
            reason,
          } = packet
          else {
            continue;
          };

          if ack_request_id != request_id {
            continue;
          }
          if host_device_id != peer_device_id {
            debug_output(|| {
              println!(
                "[sync-history] peer={} request_id={} ack_source_device_id_mismatch expected={} actual={}",
                peer_device_id, request_id, peer_device_id, host_device_id
              );
            });
          }

          if !accepted {
            let message = reason.unwrap_or_else(|| "history_sync_rejected".to_string());
            return Err(message);
          }

          let acked_seq = last_applied_seq.max(since_seq);
          update_peer_acked_seq(peer_device_id, acked_seq)?;
          since_seq = acked_seq;
          total_applied += applied_count;
          debug_output(|| {
            println!(
              "[sync-history] peer={} request_id={} acked_seq={} applied_count={}",
              peer_device_id,
              request_id,
              acked_seq,
              applied_count
            );
          });
          received_ack = true;
          break;
        }

        if received_ack {
          break;
        }
      }

      if !received_ack {
        return Err(format!(
          "No history sync ACK from peer {} (send_errors={}, payload_bytes={}). Ensure both devices are online.",
          peer_device_id,
          send_errors,
          payload.len()
        ));
      }
    }
  }
}

fn split_history_changes_for_udp(
  local_device: &str,
  peer_device_id: &str,
  changes: &[HistorySyncChange],
  max_packet_bytes: usize,
) -> Result<Vec<Vec<HistorySyncChange>>, String> {
  let mut batches: Vec<Vec<HistorySyncChange>> = Vec::new();
  let mut current_batch: Vec<HistorySyncChange> = Vec::new();

  for change in changes.iter().cloned() {
    let mut candidate = current_batch.clone();
    candidate.push(change.clone());
    let candidate_payload_size =
      encode_history_sync_push(local_device, peer_device_id, "probe", &candidate)?.len();

    if candidate_payload_size <= max_packet_bytes {
      current_batch = candidate;
      continue;
    }

    if current_batch.is_empty() {
      return Err(format!(
        "History change {} is too large for UDP payload ({} bytes > {} bytes).",
        change.row_id, candidate_payload_size, max_packet_bytes
      ));
    }

    batches.push(current_batch);
    current_batch = vec![change];

    let single_payload_size =
      encode_history_sync_push(local_device, peer_device_id, "probe", &current_batch)?.len();
    if single_payload_size > max_packet_bytes {
      return Err(format!(
        "History change {} is too large for UDP payload ({} bytes > {} bytes).",
        current_batch[0].row_id, single_payload_size, max_packet_bytes
      ));
    }
  }

  if !current_batch.is_empty() {
    batches.push(current_batch);
  }

  Ok(batches)
}

fn encode_history_sync_push(
  local_device: &str,
  peer_device_id: &str,
  request_id: &str,
  changes: &[HistorySyncChange],
) -> Result<Vec<u8>, String> {
  let packet = PairingPacket::HistorySyncPush {
    request_id: request_id.to_string(),
    source_device_id: local_device.to_string(),
    target_device_id: peer_device_id.to_string(),
    changes: changes.to_vec(),
  };
  serde_json::to_vec(&packet).map_err(|e| format!("Failed to encode history sync: {}", e))
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

fn peer_is_trusted(peer_device_id: &str) -> Result<bool, String> {
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

fn ipv4_broadcast_from_ip_and_netmask(ip: Ipv4Addr, netmask: Ipv4Addr) -> Ipv4Addr {
  let ip_u32 = u32::from(ip);
  let netmask_u32 = u32::from(netmask);
  Ipv4Addr::from(ip_u32 | !netmask_u32)
}

fn ipv4_subnet_hosts(ip: Ipv4Addr, netmask: Ipv4Addr) -> Vec<Ipv4Addr> {
  let ip_u32 = u32::from(ip);
  let netmask_u32 = u32::from(netmask);
  let network = ip_u32 & netmask_u32;
  let broadcast = network | !netmask_u32;

  if broadcast <= network + 1 {
    return Vec::new();
  }

  let mut hosts = Vec::new();
  for host in (network + 1)..broadcast {
    let candidate = Ipv4Addr::from(host);
    if candidate != ip {
      hosts.push(candidate);
    }
  }
  hosts
}

pub fn local_device_id() -> String {
  LOCAL_DEVICE_ID.clone()
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

fn run_listener_loop(
  socket: UdpSocket,
  state: Arc<Mutex<PairingState>>,
  stop_signal: Arc<AtomicBool>,
  mdns_advertiser: Arc<Mutex<Option<MdnsAdvertiser>>>,
) {
  let mut ping_log_seen_at: HashMap<String, i64> = HashMap::new();
  while !stop_signal.load(Ordering::SeqCst) {
    let mut buffer = [0u8; 65535];
    let recv = socket.recv_from(&mut buffer);
    let (len, source_addr) = match recv {
      Ok(result) => result,
      Err(_) => continue,
    };

    let packet = match serde_json::from_slice::<PairingPacket>(&buffer[..len]) {
      Ok(packet) => packet,
      Err(_) => continue,
    };

    match packet {
      PairingPacket::PairRequest {
        request_id,
        code,
        requester_device_id,
      } => {
        let now = now_ms();
        let mut accepted = false;
        let mut rejection_reason: Option<String> = None;
        let mut refresh_mdns = false;

        if let Ok(mut runtime_state) = state.lock() {
          if !runtime_state.enabled {
            rejection_reason = Some("sync_off".to_string());
          } else {
            let discoverable_before = runtime_state.pair_code.is_some();
            expire_discoverable_window(&mut runtime_state, now);

            match runtime_state.pair_code.as_deref() {
              Some(active_code) if active_code == code => {
                accepted = true;
                runtime_state.pair_code = None;
                runtime_state.discoverable_until_ms = None;
                runtime_state.last_error = None;
              }
              Some(_) => {
                rejection_reason = Some("invalid_code".to_string());
              }
              None => {
                rejection_reason = Some("not_discoverable".to_string());
              }
            }
            refresh_mdns = discoverable_before != runtime_state.pair_code.is_some();
          }
        } else {
          rejection_reason = Some("runtime_lock_error".to_string());
        }
        if refresh_mdns {
          let _ = refresh_mdns_advertisement(&state, &mdns_advertiser);
        }

        if accepted {
          if let Err(err) = trust_peer_in_db(&requester_device_id) {
            accepted = false;
            rejection_reason = Some("database_error".to_string());
            if let Ok(mut runtime_state) = state.lock() {
              runtime_state.last_error = Some(err);
            }
          }
        }

        let ack_packet = PairingPacket::PairAck {
          request_id,
          accepted,
          host_device_id: local_device_id(),
          reason: rejection_reason,
        };

        if let Ok(payload) = serde_json::to_vec(&ack_packet) {
          let _ = socket.send_to(&payload, source_addr);
        }
      }
      PairingPacket::DiscoveryProbe {
        request_id,
        requester_device_id: _,
      } => {
        let now = now_ms();
        let mut refresh_mdns = false;
        let (discoverable, sync_enabled) = if let Ok(mut runtime_state) = state.lock() {
          let discoverable_before = runtime_state.pair_code.is_some();
          expire_discoverable_window(&mut runtime_state, now);
          refresh_mdns = discoverable_before != runtime_state.pair_code.is_some();
          (
            runtime_state.enabled && runtime_state.pair_code.is_some(),
            runtime_state.enabled,
          )
        } else {
          (false, false)
        };
        if refresh_mdns {
          let _ = refresh_mdns_advertisement(&state, &mdns_advertiser);
        }

        let ack_packet = PairingPacket::DiscoveryAck {
          request_id,
          host_device_id: local_device_id(),
          discoverable,
          sync_enabled,
        };

        if let Ok(payload) = serde_json::to_vec(&ack_packet) {
          let _ = socket.send_to(&payload, source_addr);
        }
      }
      PairingPacket::HistorySyncPush {
        request_id,
        source_device_id,
        target_device_id,
        changes,
      } => {
        debug_output(|| {
          println!(
            "[sync-history][recv] source_addr={} source_device_id={} target_device_id={} payload_bytes={} changes={}",
            source_addr,
            source_device_id,
            target_device_id,
            len,
            changes.len()
          );
        });
        if !matches_local_target_device(&target_device_id) {
          debug_output(|| {
            println!(
              "[sync-net][drop] kind=history_sync_push reason=target_mismatch source_device_id={} target_device_id={} local_device_id={}",
              source_device_id,
              target_device_id,
              local_device_id()
            );
          });
          continue;
        }

        let is_enabled = state
          .lock()
          .map(|runtime_state| runtime_state.enabled)
          .unwrap_or(false);
        if !is_enabled {
          let ack_packet = PairingPacket::HistorySyncAck {
            request_id,
            host_device_id: local_device_id(),
            accepted: false,
            applied_count: 0,
            last_applied_seq: 0,
            reason: Some("sync_off".to_string()),
          };
          if let Ok(payload) = serde_json::to_vec(&ack_packet) {
            let _ = socket.send_to(&payload, source_addr);
          }
          continue;
        }

        let trusted = peer_is_trusted(&source_device_id).unwrap_or(false);
        if !trusted {
          debug_output(|| {
            println!(
              "[sync-net][drop] kind=history_sync_push reason=untrusted_peer source_device_id={} target_device_id={}",
              source_device_id, target_device_id
            );
          });
          let ack_packet = PairingPacket::HistorySyncAck {
            request_id,
            host_device_id: local_device_id(),
            accepted: false,
            applied_count: 0,
            last_applied_seq: 0,
            reason: Some("untrusted_peer".to_string()),
          };
          if let Ok(payload) = serde_json::to_vec(&ack_packet) {
            let _ = socket.send_to(&payload, source_addr);
          }
          continue;
        }

        let apply_result: Result<(usize, i64), String> = (|| {
          let mut conn = establish_pool_db_connection();
          let mut remote_apply =
            enable_remote_apply_context(&mut conn).map_err(|e| e.to_string())?;
          apply_history_changes(remote_apply.conn_mut(), &changes)
        })();

        match apply_result {
          Ok((applied_count, last_applied_seq)) => {
            let _ = update_peer_last_applied_seq(&source_device_id, last_applied_seq);
            let ack_packet = PairingPacket::HistorySyncAck {
              request_id,
              host_device_id: local_device_id(),
              accepted: true,
              applied_count,
              last_applied_seq,
              reason: None,
            };
            if let Ok(payload) = serde_json::to_vec(&ack_packet) {
              let _ = socket.send_to(&payload, source_addr);
            }
          }
          Err(error) => {
            let ack_packet = PairingPacket::HistorySyncAck {
              request_id,
              host_device_id: local_device_id(),
              accepted: false,
              applied_count: 0,
              last_applied_seq: 0,
              reason: Some(error),
            };
            if let Ok(payload) = serde_json::to_vec(&ack_packet) {
              let _ = socket.send_to(&payload, source_addr);
            }
          }
        }
      }
      PairingPacket::PingJson {
        request_id,
        source_device_id,
        target_device_id,
        id,
        time,
        pong: _,
      } => {
        if !matches_local_target_device(&target_device_id) {
          debug_output(|| {
            println!(
              "[sync-net][drop] kind=ping reason=target_mismatch source_device_id={} target_device_id={} local_device_id={}",
              source_device_id,
              target_device_id,
              local_device_id()
            );
          });
          continue;
        }

        let is_enabled = state
          .lock()
          .map(|runtime_state| runtime_state.enabled)
          .unwrap_or(false);
        if !is_enabled {
          continue;
        }

        let trusted = peer_is_trusted(&source_device_id).unwrap_or(false);
        if !trusted {
          debug_output(|| {
            println!(
              "[sync-ping] source_device_id={} is not trusted yet; responding anyway for diagnostics target_device_id={}",
              source_device_id, target_device_id
            );
          });
        }

        let ping_id = id.clone();
        let now = now_ms();
        ping_log_seen_at.retain(|_, seen_at| now - *seen_at <= 5_000);
        let ping_log_key = format!("{}:{}:{}", source_device_id, request_id, ping_id);
        let should_log = ping_log_seen_at
          .insert(ping_log_key, now)
          .map(|seen_at| now - seen_at > 1_500)
          .unwrap_or(true);
        let response = PairingPacket::PongJson {
          request_id,
          source_device_id: local_device_id(),
          target_device_id: source_device_id,
          id,
          time,
          pong: true,
        };
        if should_log {
          debug_output(|| {
            println!(
              "[sync-ping] responding_to={} id={} time={} pong=true trusted_source={}",
              source_addr, ping_id, time, trusted
            );
          });
        }
        if let Ok(payload) = serde_json::to_vec(&response) {
          let _ = socket.send_to(&payload, source_addr);
        }
      }
      _ => continue,
    }
  }
}

fn trust_peer_in_db(peer_device_id: &str) -> Result<(), String> {
  let now = now_ms();
  let mut conn = establish_pool_db_connection();

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
  .execute(&mut conn)
  .map_err(|e| e.to_string())?;

  Ok(())
}

fn now_ms() -> i64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default()
    .as_millis() as i64
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn ignores_self_not_discoverable_rejection() {
    assert!(should_ignore_rejection_for_self_not_discoverable(
      false,
      "device-a",
      "device-a",
      Some("not_discoverable"),
    ));
  }

  #[test]
  fn does_not_ignore_non_self_not_discoverable_rejection() {
    assert!(!should_ignore_rejection_for_self_not_discoverable(
      false,
      "device-b",
      "device-a",
      Some("not_discoverable"),
    ));
  }

  #[test]
  fn does_not_ignore_self_when_accepted() {
    assert!(!should_ignore_rejection_for_self_not_discoverable(
      true, "device-a", "device-a", None,
    ));
  }

  #[test]
  fn humanizes_not_discoverable_reason() {
    assert_eq!(
      humanize_rejection_reason("not_discoverable"),
      "Target device is not discoverable. Generate a new 6-digit code and retry."
    );
  }

  #[test]
  fn splits_history_batches_when_payload_too_large() {
    let changes: Vec<HistorySyncChange> = (0..4)
      .map(|idx| HistorySyncChange {
        seq: idx + 1,
        source_device_id: "device-a".to_string(),
        op: "insert".to_string(),
        row_id: format!("history-{}", idx),
        hlc_wall_ms: 1_000 + idx,
        hlc_counter: 1,
        updated_at: 1_000 + idx,
        row_json: Some(format!(
          "{{\"history_id\":\"history-{}\",\"value\":\"{}\"}}",
          idx,
          "x".repeat(128)
        )),
      })
      .collect();

    let batches = split_history_changes_for_udp("device-a", "device-b", &changes, 700)
      .expect("Failed to split history changes");

    assert!(batches.len() >= 2);
    assert_eq!(
      batches.iter().map(|batch| batch.len()).sum::<usize>(),
      changes.len()
    );
  }
}
