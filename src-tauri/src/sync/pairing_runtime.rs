use diesel::sql_types::{BigInt, Text};
use diesel::RunQueryDsl;
use once_cell::sync::Lazy;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::net::{SocketAddr, UdpSocket};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use crate::db::establish_pool_db_connection;

const PAIRING_PORT: u16 = 45879;
const DISCOVERABLE_WINDOW_MS: i64 = 60_000;
const SOCKET_POLL_TIMEOUT_MS: u64 = 250;
const JOIN_ATTEMPTS: usize = 3;
const JOIN_WAIT_PER_ATTEMPT_MS: i64 = 1_500;
const DISCOVERY_ATTEMPTS: usize = 2;
const DISCOVERY_WAIT_PER_ATTEMPT_MS: i64 = 900;

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
}

#[derive(Debug, Default, Clone)]
struct PairingState {
  enabled: bool,
  pair_code: Option<String>,
  discoverable_until_ms: Option<i64>,
  last_error: Option<String>,
}

#[derive(Debug, Clone)]
pub struct PairingSnapshot {
  pub discoverable: bool,
  pub discoverable_until_ms: Option<i64>,
  pub pair_code: Option<String>,
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

#[derive(Clone, Debug)]
pub struct PairingRuntime {
  state: Arc<Mutex<PairingState>>,
  stop_signal: Arc<AtomicBool>,
  worker: Arc<Mutex<Option<JoinHandle<()>>>>,
}

impl Default for PairingRuntime {
  fn default() -> Self {
    Self {
      state: Arc::new(Mutex::new(PairingState::default())),
      stop_signal: Arc::new(AtomicBool::new(false)),
      worker: Arc::new(Mutex::new(None)),
    }
  }
}

impl PairingRuntime {
  pub fn set_enabled(&self, enabled: bool) -> Result<(), String> {
    if enabled {
      {
        let mut state = self
          .state
          .lock()
          .map_err(|_| "Pairing state lock poisoned".to_string())?;
        state.enabled = true;
      }
      self.start_listener()
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
      self.stop_listener();
      Ok(())
    }
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
    Ok(code)
  }

  pub fn cancel_pair_code(&self) -> Result<(), String> {
    let mut state = self
      .state
      .lock()
      .map_err(|_| "Pairing state lock poisoned".to_string())?;
    state.pair_code = None;
    state.discoverable_until_ms = None;
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

    let broadcast_addr = SocketAddr::from(([255, 255, 255, 255], PAIRING_PORT));
    let mut last_rejection: Option<String> = None;

    for _ in 0..JOIN_ATTEMPTS {
      let _ = socket.send_to(&payload, broadcast_addr);

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

    let broadcast_addr = SocketAddr::from(([255, 255, 255, 255], PAIRING_PORT));
    let loopback_addr = SocketAddr::from(([127, 0, 0, 1], PAIRING_PORT));
    let mut discovered: BTreeMap<String, PairingDiscoveredDevice> = BTreeMap::new();

    for _ in 0..DISCOVERY_ATTEMPTS {
      let _ = socket.send_to(&payload, broadcast_addr);
      let _ = socket.send_to(&payload, loopback_addr);

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

  pub fn snapshot(&self) -> Result<PairingSnapshot, String> {
    {
      let mut state = self
        .state
        .lock()
        .map_err(|_| "Pairing state lock poisoned".to_string())?;
      expire_discoverable_window(&mut state, now_ms());
    }

    let state = self
      .state
      .lock()
      .map_err(|_| "Pairing state lock poisoned".to_string())?;
    Ok(PairingSnapshot {
      discoverable: state.enabled && state.pair_code.is_some(),
      discoverable_until_ms: state.discoverable_until_ms,
      pair_code: state.pair_code.clone(),
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

    let handle = std::thread::Builder::new()
      .name("pastebar-sync-pairing-listener".to_string())
      .spawn(move || {
        run_listener_loop(socket, state, stop_signal);
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

  fn set_last_error(&self, message: String) -> Result<(), String> {
    let mut state = self
      .state
      .lock()
      .map_err(|_| "Pairing state lock poisoned".to_string())?;
    state.last_error = Some(message);
    Ok(())
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
) {
  while !stop_signal.load(Ordering::SeqCst) {
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

    match packet {
      PairingPacket::PairRequest {
        request_id,
        code,
        requester_device_id,
      } => {
        let now = now_ms();
        let mut accepted = false;
        let mut rejection_reason: Option<String> = None;

        if let Ok(mut runtime_state) = state.lock() {
          if !runtime_state.enabled {
            rejection_reason = Some("sync_off".to_string());
          } else {
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
          }
        } else {
          rejection_reason = Some("runtime_lock_error".to_string());
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
        let (discoverable, sync_enabled) = if let Ok(mut runtime_state) = state.lock() {
          expire_discoverable_window(&mut runtime_state, now);
          (
            runtime_state.enabled && runtime_state.pair_code.is_some(),
            runtime_state.enabled,
          )
        } else {
          (false, false)
        };

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
}
