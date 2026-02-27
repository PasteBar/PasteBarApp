use diesel::prelude::*;
use diesel::sql_types::{BigInt, Integer, Nullable, Text};
use diesel::sqlite::SqliteConnection;
use diesel::QueryableByName;
use once_cell::sync::Lazy;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use crate::sync::discovery::get_peer_ips;
use crate::sync::pairing_runtime::peer_is_trusted;
use crate::db::establish_pool_db_connection;

static FETCH_QUEUE: Lazy<Mutex<HashSet<String>>> = Lazy::new(|| Mutex::new(HashSet::new()));

#[derive(QueryableByName)]
struct BlobRefRow {
  #[diesel(sql_type = Text)]
  blob_hash: String,
  #[diesel(sql_type = Nullable<Text>)]
  local_rel_path: Option<String>,
}

pub trait BlobStore {
  fn delete(&self, blob_hash: &str) -> Result<(), String>;
}

#[derive(Debug, Default, Clone, Copy)]
pub struct NoopBlobStore;

impl BlobStore for NoopBlobStore {
  fn delete(&self, _blob_hash: &str) -> Result<(), String> {
    Ok(())
  }
}

pub fn clear_fetch_queue() {
  if let Ok(mut queue) = FETCH_QUEUE.lock() {
    queue.clear();
  }
}

pub fn is_blob_fetch_queued(blob_hash: &str) -> bool {
  FETCH_QUEUE
    .lock()
    .map(|queue| queue.contains(blob_hash))
    .unwrap_or(false)
}

pub fn ensure_blob_available(
  conn: &mut SqliteConnection,
  blob_hash: &str,
  now_ms: i64,
) -> Result<bool, String> {
  if blob_exists_locally(conn, blob_hash).map_err(|e| e.to_string())? {
    return Ok(false);
  }

  diesel::sql_query(
    "INSERT INTO sync_blob_refs (
      blob_hash, local_rel_path, mime_type, size_bytes, ref_count, last_seen_at, created_at, updated_at
    ) VALUES (?, NULL, NULL, NULL, 0, ?, ?, ?)
    ON CONFLICT(blob_hash) DO UPDATE SET
      last_seen_at = excluded.last_seen_at,
      updated_at = excluded.updated_at",
  )
  .bind::<Text, _>(blob_hash.to_string())
  .bind::<BigInt, _>(now_ms)
  .bind::<BigInt, _>(now_ms)
  .bind::<BigInt, _>(now_ms)
  .execute(conn)
  .map_err(|e| e.to_string())?;

  enqueue_blob_fetch(blob_hash);
  Ok(true)
}

pub fn increment_blob_reference(
  conn: &mut SqliteConnection,
  blob_hash: &str,
  local_rel_path: Option<&str>,
  mime_type: Option<&str>,
  size_bytes: Option<i64>,
  now_ms: i64,
) -> QueryResult<()> {
  diesel::sql_query(
    "INSERT INTO sync_blob_refs (
      blob_hash, local_rel_path, mime_type, size_bytes, ref_count, last_seen_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
    ON CONFLICT(blob_hash) DO UPDATE SET
      local_rel_path = COALESCE(excluded.local_rel_path, sync_blob_refs.local_rel_path),
      mime_type = COALESCE(excluded.mime_type, sync_blob_refs.mime_type),
      size_bytes = COALESCE(excluded.size_bytes, sync_blob_refs.size_bytes),
      ref_count = sync_blob_refs.ref_count + 1,
      last_seen_at = excluded.last_seen_at,
      updated_at = excluded.updated_at",
  )
  .bind::<Text, _>(blob_hash.to_string())
  .bind::<Nullable<Text>, _>(local_rel_path.map(|s| s.to_string()))
  .bind::<Nullable<Text>, _>(mime_type.map(|s| s.to_string()))
  .bind::<Nullable<BigInt>, _>(size_bytes)
  .bind::<BigInt, _>(now_ms)
  .bind::<BigInt, _>(now_ms)
  .bind::<BigInt, _>(now_ms)
  .execute(conn)
  .map(|_| ())
}

pub fn decrement_blob_reference(
  conn: &mut SqliteConnection,
  blob_hash: &str,
  now_ms: i64,
) -> QueryResult<()> {
  diesel::sql_query(
    "UPDATE sync_blob_refs
     SET ref_count = CASE WHEN ref_count > 0 THEN ref_count - 1 ELSE 0 END,
         updated_at = ?
     WHERE blob_hash = ?",
  )
  .bind::<BigInt, _>(now_ms)
  .bind::<Text, _>(blob_hash.to_string())
  .execute(conn)
  .map(|_| ())
}

pub fn garbage_collect_unreferenced_blobs(
  conn: &mut SqliteConnection,
  blob_store: &dyn BlobStore,
  media_root: &Path,
) -> Result<Vec<String>, String> {
  let rows: Vec<BlobRefRow> = diesel::sql_query(
    "SELECT blob_hash, local_rel_path
     FROM sync_blob_refs
     WHERE ref_count <= 0",
  )
  .load(conn)
  .map_err(|e| e.to_string())?;

  let mut deleted_hashes = Vec::new();
  for row in rows {
    if let Some(rel_path) = row.local_rel_path.as_deref() {
      let file_path = media_root.join(rel_path);
      if let Err(err) = fs::remove_file(&file_path) {
        if err.kind() != std::io::ErrorKind::NotFound {
          return Err(err.to_string());
        }
      }
    }

    blob_store.delete(&row.blob_hash)?;
    diesel::sql_query("DELETE FROM sync_blob_refs WHERE blob_hash = ?")
      .bind::<Text, _>(row.blob_hash.clone())
      .execute(conn)
      .map_err(|e| e.to_string())?;
    deleted_hashes.push(row.blob_hash);
  }

  Ok(deleted_hashes)
}

fn enqueue_blob_fetch(blob_hash: &str) {
  if let Ok(mut queue) = FETCH_QUEUE.lock() {
    queue.insert(blob_hash.to_string());
  }
}

fn blob_exists_locally(conn: &mut SqliteConnection, blob_hash: &str) -> QueryResult<bool> {
  #[derive(QueryableByName)]
  struct ExistsRow {
    #[diesel(sql_type = Integer)]
    exists_flag: i32,
  }

  let rows: Vec<ExistsRow> = diesel::sql_query(
    "SELECT CASE
      WHEN EXISTS (
        SELECT 1 FROM sync_blob_refs
        WHERE blob_hash = ?
          AND local_rel_path IS NOT NULL
          AND ref_count > 0
      ) THEN 1 ELSE 0 END AS exists_flag",
  )
  .bind::<Text, _>(blob_hash.to_string())
  .load(conn)?;

  Ok(rows[0].exists_flag == 1)
}

pub fn start_fetch_queue_worker(stop_signal: Arc<AtomicBool>, media_root: PathBuf) {
  tokio::spawn(async move {
    let client = reqwest::Client::builder()
      .timeout(Duration::from_secs(30))
      .build()
      .unwrap_or_default();

    while !stop_signal.load(Ordering::SeqCst) {
      tokio::time::sleep(Duration::from_millis(500)).await;

      let mut hashes_to_fetch = Vec::new();
      if let Ok(mut queue) = FETCH_QUEUE.lock() {
        if !queue.is_empty() {
          hashes_to_fetch = queue.drain().collect();
        }
      }

      if hashes_to_fetch.is_empty() {
        continue;
      }

      for blob_hash in hashes_to_fetch {
        if stop_signal.load(Ordering::SeqCst) {
          break;
        }

        let peers = {
          let peer_ips = get_peer_ips().read().unwrap();
          let mut trusted_peers = Vec::new();
          for (device_id, addr) in peer_ips.iter() {
            if peer_is_trusted(device_id).unwrap_or(false) {
              trusted_peers.push((device_id.clone(), *addr));
            }
          }
          trusted_peers
        };

        if peers.is_empty() {
          enqueue_blob_fetch(&blob_hash);
          continue;
        }

        let mut success = false;
        for (_peer_id, addr) in peers {
          let url = format!("http://{}:{}/sync/blob/{}", addr.ip(), addr.port(), blob_hash);
          if let Ok(response) = client.get(&url).send().await {
            if response.status().is_success() {
              if let Ok(bytes) = response.bytes().await {
                // ToDo: Implement Decryption here based on AEAD
                
                let rel_path = format!("{}.blob", blob_hash);
                let full_path = media_root.join(&rel_path);
                
                if let Some(parent) = full_path.parent() {
                  let _ = std::fs::create_dir_all(parent);
                }
                
                if std::fs::write(&full_path, &bytes).is_ok() {
                  let mut conn = establish_pool_db_connection();
                  let now = crate::sync::pairing_runtime::now_ms();
                  let _ = diesel::sql_query(
                    "UPDATE sync_blob_refs SET local_rel_path = ?, updated_at = ?, size_bytes = ? WHERE blob_hash = ?"
                  )
                  .bind::<Text, _>(&rel_path)
                  .bind::<BigInt, _>(now)
                  .bind::<BigInt, _>(bytes.len() as i64)
                  .bind::<Text, _>(&blob_hash)
                  .execute(&mut conn);
                  
                  success = true;
                  break;
                }
              }
            }
          }
        }

        if !success {
          enqueue_blob_fetch(&blob_hash);
        }
      }
    }
  });
}

pub fn read_local_blob(blob_hash: &str, media_root: &Path) -> Result<Vec<u8>, String> {
  #[derive(QueryableByName)]
  struct PathRow {
    #[diesel(sql_type = Nullable<Text>)]
    local_rel_path: Option<String>,
  }

  let mut conn = establish_pool_db_connection();
  let rows: Vec<PathRow> = diesel::sql_query(
    "SELECT local_rel_path FROM sync_blob_refs WHERE blob_hash = ? AND local_rel_path IS NOT NULL LIMIT 1"
  )
  .bind::<Text, _>(blob_hash)
  .load(&mut conn)
  .map_err(|e| e.to_string())?;

  if let Some(row) = rows.first() {
    if let Some(rel_path) = &row.local_rel_path {
      let full_path = media_root.join(rel_path);
      return fs::read(full_path).map_err(|e| e.to_string());
    }
  }

  Err("Blob not found locally".to_string())
}
