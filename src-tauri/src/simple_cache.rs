use std::collections::HashMap;

use std::sync::Arc;
use tokio::sync::RwLock; // Use Tokio's RwLock

use std::time::{Duration, Instant};

#[derive(Clone, Debug)]
pub struct CacheEntry<T> {
  value: T,
  expires_at: Option<Instant>,
}

impl<T> CacheEntry<T> {
  pub fn new(value: T, ttl: Option<Duration>) -> Self {
    CacheEntry {
      value,
      expires_at: ttl.map(|d| Instant::now() + d),
    }
  }

  fn is_expired(&self) -> bool {
    self.expires_at.map_or(false, |e| Instant::now() > e)
  }
}

#[derive(Clone, Debug)]
pub struct SimpleCache<T> {
  map: Arc<RwLock<HashMap<String, CacheEntry<T>>>>,
  max_size: usize,
}

impl<T: Clone> SimpleCache<T> {
  pub fn new(max_size: usize) -> Self {
    SimpleCache {
      map: Arc::new(RwLock::new(HashMap::new())),
      max_size,
    }
  }

  pub async fn insert(&self, key: String, value: T, ttl: Option<Duration>) {
    let mut map = self.map.write().await;

    // Simple mechanism to avoid exceeding max_size, not LRU
    if map.len() == self.max_size {
      if let Some(key_to_remove) = map.keys().next().cloned() {
        map.remove(&key_to_remove);
      }
    }

    map.insert(key, CacheEntry::new(value, ttl));
  }

  pub async fn get(&self, key: &str) -> Option<T> {
    let map = self.map.read().await;
    map.get(key).and_then(|entry| {
      if !entry.is_expired() {
        Some(entry.value.clone())
      } else {
        None
      }
    })
  }
}
