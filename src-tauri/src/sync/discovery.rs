use mdns_sd::{ServiceDaemon, ServiceEvent};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, RwLock, OnceLock};
use std::thread;

pub fn get_peer_ips() -> &'static Arc<RwLock<HashMap<String, SocketAddr>>> {
  static PEER_IPS: OnceLock<Arc<RwLock<HashMap<String, SocketAddr>>>> = OnceLock::new();
  PEER_IPS.get_or_init(|| Arc::new(RwLock::new(HashMap::new())))
}

#[derive(Clone, Debug, Default)]
pub struct DiscoveryService {
  running: Arc<AtomicBool>,
}

impl DiscoveryService {
  pub fn start(&self) -> Result<(), String> {
    if self.running.load(Ordering::SeqCst) {
      return Ok(());
    }
    self.running.store(true, Ordering::SeqCst);
    let running_flag = self.running.clone();

    thread::spawn(move || {
      if let Ok(daemon) = ServiceDaemon::new() {
        let service_type = "_pastebar-sync._udp.local.";
        if let Ok(receiver) = daemon.browse(service_type) {
          while running_flag.load(Ordering::SeqCst) {
            if let Ok(event) = receiver.recv_timeout(std::time::Duration::from_millis(500)) {
              match event {
                ServiceEvent::ServiceResolved(info) => {
                  let props = info.get_properties();
                  let device_id = props.iter().find(|entry| entry.key() == "device_id")
                    .and_then(|entry| entry.val())
                    .map(|value| String::from_utf8_lossy(value).to_string())
                    .unwrap_or_else(|| {
                       let fullname = info.get_fullname();
                       fullname.split('.').next().unwrap_or("").to_string()
                    });

                  if let Some(addr) = info.get_addresses().iter().next() {
                    let port = info.get_port();
                    let ip_str = addr.to_string();
                    let clean_ip = ip_str.split('%').next().unwrap_or(&ip_str);
                    if let Ok(ip) = clean_ip.parse() {
                      let socket_addr = SocketAddr::new(ip, port);
                      if let Ok(mut map) = get_peer_ips().write() {
                        map.insert(device_id, socket_addr);
                      }
                    }
                  }
                }
                ServiceEvent::ServiceRemoved(service_type, fullname) => {
                  let device_id = fullname.split('.').next().unwrap_or("").to_string();
                  if let Ok(mut map) = get_peer_ips().write() {
                    map.remove(&device_id);
                  }
                }
                _ => {}
              }
            }
          }
        }
      }
    });

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
