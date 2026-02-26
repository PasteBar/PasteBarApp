use super::keys::DataKey;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Clone, Debug, Default)]
pub struct PairingStore {
  inner: Arc<Mutex<HashMap<String, DataKey>>>,
}

impl PairingStore {
  pub fn trust_peer(&self, peer_device_id: &str, shared_key: DataKey) -> Result<(), String> {
    self
      .inner
      .lock()
      .map_err(|_| "Pairing store lock poisoned".to_string())?
      .insert(peer_device_id.to_string(), shared_key);
    Ok(())
  }

  pub fn untrust_peer(&self, peer_device_id: &str) -> Result<bool, String> {
    let removed = self
      .inner
      .lock()
      .map_err(|_| "Pairing store lock poisoned".to_string())?
      .remove(peer_device_id)
      .is_some();
    Ok(removed)
  }

  pub fn is_trusted(&self, peer_device_id: &str) -> Result<bool, String> {
    let trusted = self
      .inner
      .lock()
      .map_err(|_| "Pairing store lock poisoned".to_string())?
      .contains_key(peer_device_id);
    Ok(trusted)
  }

  pub fn peer_key(&self, peer_device_id: &str) -> Result<Option<DataKey>, String> {
    let key = self
      .inner
      .lock()
      .map_err(|_| "Pairing store lock poisoned".to_string())?
      .get(peer_device_id)
      .copied();
    Ok(key)
  }
}
