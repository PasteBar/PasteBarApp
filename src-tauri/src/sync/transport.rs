use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

#[derive(Clone, Debug, Default)]
pub struct TransportService {
  running: Arc<AtomicBool>,
}

impl TransportService {
  pub fn start(&self) -> Result<(), String> {
    self.running.store(true, Ordering::SeqCst);
    Ok(())
  }

  pub fn stop(&self) -> Result<(), String> {
    self.running.store(false, Ordering::SeqCst);
    Ok(())
  }

  pub fn is_running(&self) -> bool {
    self.running.load(Ordering::SeqCst)
  }
}
