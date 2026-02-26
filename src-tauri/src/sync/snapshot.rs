use diesel::prelude::*;
use diesel::sql_types::BigInt;
use diesel::sqlite::SqliteConnection;
use diesel::QueryableByName;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SnapshotManifest {
  pub checkpoint_seq: i64,
  pub snapshot_created_at_ms: i64,
  pub snapshot_file_path: String,
}

#[derive(QueryableByName)]
struct MaxSeqRow {
  #[diesel(sql_type = BigInt)]
  max_seq: i64,
}

pub fn create_snapshot(
  conn: &mut SqliteConnection,
  snapshot_file_path: &str,
) -> Result<SnapshotManifest, String> {
  let checkpoint_seq = query_max_seq(conn).map_err(|e| e.to_string())?;
  create_sqlite_snapshot(conn, snapshot_file_path)?;

  Ok(SnapshotManifest {
    checkpoint_seq,
    snapshot_created_at_ms: now_ms(),
    snapshot_file_path: snapshot_file_path.to_string(),
  })
}

fn query_max_seq(conn: &mut SqliteConnection) -> QueryResult<i64> {
  let rows: Vec<MaxSeqRow> =
    diesel::sql_query("SELECT COALESCE(MAX(seq), 0) AS max_seq FROM sync_changes").load(conn)?;
  Ok(rows[0].max_seq)
}

fn create_sqlite_snapshot(conn: &mut SqliteConnection, snapshot_file_path: &str) -> Result<(), String> {
  let escaped_path = snapshot_file_path.replace('\'', "''");
  let sql = format!("VACUUM INTO '{}'", escaped_path);
  diesel::sql_query(sql)
    .execute(conn)
    .map(|_| ())
    .map_err(|e| e.to_string())
}

fn now_ms() -> i64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default()
    .as_millis() as i64
}
