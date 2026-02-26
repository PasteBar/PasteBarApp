use diesel::prelude::*;
use diesel::sql_types::{BigInt, Integer, Nullable, Text};
use diesel::sqlite::SqliteConnection;
use diesel::QueryableByName;
use once_cell::sync::Lazy;
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use std::sync::Mutex;

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
