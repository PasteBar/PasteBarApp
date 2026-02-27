use diesel::sql_types::{BigInt, Text};
use diesel::RunQueryDsl;
use if_addrs::{get_if_addrs, IfAddr};
use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use once_cell::sync::Lazy;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::net::{IpAddr, Ipv4Addr, SocketAddr, UdpSocket};
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
const MAX_SUBNET_SWEEP_HOSTS_PER_INTERFACE: usize = 256;
const MDNS_SERVICE_TYPE: &str = "_pastebar-sync._udp.local.";

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

#[derive(Clone)]
pub struct PairingRuntime {
  state: Arc<Mutex<PairingState>>,
  stop_signal: Arc<AtomicBool>,
  worker: Arc<Mutex<Option<JoinHandle<()>>>>,
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
      mdns_advertiser: Arc::new(Mutex::new(None)),
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
      self.start_listener()?;
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
      self.stop_listener();
      let _ = refresh_mdns_advertisement(&self.state, &self.mdns_advertiser);
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

  let host_name = format!("{}.local.", local_device_id());
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
