use diesel::prelude::*;
use diesel::sql_types::BigInt;
use diesel::sqlite::SqliteConnection;
use diesel::QueryableByName;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct SyncStats {
  pub applied_events: u64,
  pub pending_events: u64,
  pub dead_letter_events: u64,
}

#[derive(QueryableByName)]
struct CountRow {
  #[diesel(sql_type = BigInt)]
  total: i64,
}

pub fn collect_sync_stats(
  conn: &mut SqliteConnection,
  applied_events: u64,
) -> Result<SyncStats, String> {
  let pending_events = query_count(conn, "SELECT COUNT(*) AS total FROM sync_pending_apply")?;
  let dead_letter_events = query_count(conn, "SELECT COUNT(*) AS total FROM sync_dead_letter")?;

  Ok(SyncStats {
    applied_events,
    pending_events: pending_events as u64,
    dead_letter_events: dead_letter_events as u64,
  })
}

fn query_count(conn: &mut SqliteConnection, sql: &str) -> Result<i64, String> {
  let rows: Vec<CountRow> = diesel::sql_query(sql).load(conn).map_err(|e| e.to_string())?;
  rows
    .first()
    .map(|row| row.total)
    .ok_or_else(|| "Count query returned no rows".to_string())
}
