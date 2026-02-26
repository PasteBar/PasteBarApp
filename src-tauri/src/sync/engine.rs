use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};

use super::config::SyncConfig;
use super::discovery::DiscoveryService;
use super::observability::{collect_sync_stats, SyncStats};
use super::transport::TransportService;
use super::types::SyncMode;
use diesel::sqlite::SqliteConnection;

#[derive(Debug, Clone)]
pub struct EngineSnapshot {
  pub mode: SyncMode,
  pub discovery_running: bool,
  pub session_running: bool,
  pub schedulers_running: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NetworkSnapshot {
  pub discovery_running: bool,
  pub transport_running: bool,
}

#[derive(Debug)]
struct EngineState {
  mode: SyncMode,
  discovery_running: bool,
  session_running: bool,
  schedulers_running: bool,
}

#[derive(Clone, Debug)]
pub struct SyncEngine {
  state: Arc<Mutex<EngineState>>,
  discovery: DiscoveryService,
  transport: TransportService,
  applied_events: Arc<AtomicU64>,
}

impl SyncEngine {
  pub fn new(config: SyncConfig) -> Self {
    let discovery = DiscoveryService::default();
    let transport = TransportService::default();
    Self {
      state: Arc::new(Mutex::new(EngineState {
        mode: config.mode,
        discovery_running: false,
        session_running: false,
        schedulers_running: false,
      })),
      discovery,
      transport,
      applied_events: Arc::new(AtomicU64::new(0)),
    }
  }

  pub fn set_mode(&self, mode: SyncMode) -> Result<(), String> {
    let mut state = self.state.lock().map_err(|_| "Sync engine lock poisoned")?;
    match mode {
      SyncMode::Off => {
        self.discovery.stop()?;
        self.transport.stop()?;
        state.mode = SyncMode::Off;
        state.discovery_running = self.discovery.is_running();
        state.session_running = self.transport.is_running();
        state.schedulers_running = false;
      }
      SyncMode::Paused => {
        self.discovery.stop()?;
        self.transport.stop()?;
        state.mode = SyncMode::Paused;
        state.discovery_running = self.discovery.is_running();
        state.session_running = self.transport.is_running();
        state.schedulers_running = false;
      }
      SyncMode::On => {
        self.discovery.start()?;
        self.transport.start()?;
        state.mode = SyncMode::On;
        state.discovery_running = self.discovery.is_running();
        state.session_running = self.transport.is_running();
        state.schedulers_running = true;
      }
    }
    Ok(())
  }

  pub fn snapshot(&self) -> EngineSnapshot {
    let state = self.state.lock().expect("Sync engine lock poisoned");
    EngineSnapshot {
      mode: state.mode,
      discovery_running: state.discovery_running,
      session_running: state.session_running,
      schedulers_running: state.schedulers_running,
    }
  }

  pub fn network_snapshot(&self) -> NetworkSnapshot {
    NetworkSnapshot {
      discovery_running: self.discovery.is_running(),
      transport_running: self.transport.is_running(),
    }
  }

  pub fn record_applied_events(&self, count: u64) {
    self.applied_events.fetch_add(count, Ordering::SeqCst);
  }

  pub fn collect_stats(&self, conn: &mut SqliteConnection) -> Result<SyncStats, String> {
    let applied_events = self.applied_events.load(Ordering::SeqCst);
    collect_sync_stats(conn, applied_events)
  }
}

impl Default for SyncEngine {
  fn default() -> Self {
    Self::new(SyncConfig::default())
  }
}
