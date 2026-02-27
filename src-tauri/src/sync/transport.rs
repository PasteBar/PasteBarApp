use axum::{
  routing::{get, post},
  Router,
};
use std::net::SocketAddr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tokio_util::sync::CancellationToken;

#[derive(Clone, Debug, Default)]
pub struct TransportService {
  running: Arc<AtomicBool>,
  cancel_token: Arc<Mutex<Option<CancellationToken>>>,
}

impl TransportService {
  pub fn start(&self) -> Result<(), String> {
    if self.running.load(Ordering::SeqCst) {
      return Ok(());
    }

    let token = CancellationToken::new();
    let mut cancel_lock = self.cancel_token.lock().unwrap();
    *cancel_lock = Some(token.clone());
    drop(cancel_lock);

    self.running.store(true, Ordering::SeqCst);
    let running_flag = self.running.clone();

    tokio::spawn(async move {
      let app = Router::new()
        .route("/sync/ping", post(handle_ping))
        .route("/sync/history", post(handle_history))
        .route("/sync/pair/request", post(handle_pair_request))
        .route("/sync/blob/:hash", get(handle_blob));

      let addr = SocketAddr::from(([0, 0, 0, 0], 59872));
      
      if let Ok(listener) = tokio::net::TcpListener::bind(addr).await {
        if let Err(e) = axum::serve(listener, app)
          .with_graceful_shutdown(async move {
            token.cancelled().await;
            running_flag.store(false, Ordering::SeqCst);
          })
          .await
        {
          eprintln!("Sync HTTP server error: {}", e);
        }
      } else {
        running_flag.store(false, Ordering::SeqCst);
      }
    });

    Ok(())
  }

  pub fn stop(&self) -> Result<(), String> {
    let mut cancel_lock = self.cancel_token.lock().unwrap();
    if let Some(token) = cancel_lock.take() {
      token.cancel();
    }
    self.running.store(false, Ordering::SeqCst);
    Ok(())
  }

  pub fn is_running(&self) -> bool {
    self.running.load(Ordering::SeqCst)
  }
}

async fn handle_ping(
  axum::Json(payload): axum::Json<crate::sync::types::PingRequest>,
) -> axum::Json<crate::sync::types::PongResponse> {
  match crate::commands::sync_commands::PAIRING_RUNTIME.handle_ping_request(payload.clone()) {
    Ok(response) => axum::Json(response),
    Err(_) => axum::Json(crate::sync::types::PongResponse {
      request_id: payload.request_id,
      source_device_id: crate::sync::pairing_runtime::local_device_id(),
      target_device_id: payload.source_device_id,
      id: payload.id,
      time: payload.time,
      pong: false,
    }),
  }
}



async fn handle_history(
  axum::Json(payload): axum::Json<crate::sync::types::HistorySyncPushRequest>,
) -> axum::Json<crate::sync::types::HistorySyncAckResponse> {
  match crate::commands::sync_commands::PAIRING_RUNTIME.handle_history_sync_push(payload.clone()) {
    Ok(response) => axum::Json(response),
    Err(err) => axum::Json(crate::sync::types::HistorySyncAckResponse {
      request_id: payload.request_id,
      host_device_id: crate::sync::pairing_runtime::local_device_id(),
      accepted: false,
      applied_count: 0,
      last_applied_seq: 0,
      reason: Some(err),
    }),
  }
}

async fn handle_pair_request(
  axum::Json(payload): axum::Json<crate::sync::types::PairRequestInfo>,
) -> axum::Json<crate::sync::types::PairAckResponse> {
  match crate::commands::sync_commands::PAIRING_RUNTIME.handle_pair_request(payload.clone()) {
    Ok(response) => axum::Json(response),
    Err(err) => axum::Json(crate::sync::types::PairAckResponse {
      request_id: payload.request_id,
      accepted: false,
      host_device_id: crate::sync::pairing_runtime::local_device_id(),
      reason: Some(err),
    }),
  }
}

async fn handle_blob(
  axum::extract::Path(hash): axum::extract::Path<String>,
) -> axum::response::Response {
  use axum::http::{StatusCode, header};
  use axum::response::IntoResponse;

  let media_root = crate::db::get_clip_images_dir();
  let media_root_path = std::path::PathBuf::from(media_root);
  
  match crate::sync::media::read_local_blob(&hash, &media_root_path) {
    Ok(bytes) => (
      StatusCode::OK,
      [(header::CONTENT_TYPE, "application/octet-stream")],
      bytes,
    ).into_response(),
    Err(_) => (
      StatusCode::NOT_FOUND,
      "Blob not found",
    ).into_response(),
  }
}
