use super::protocol::SyncMsg;
use diesel::prelude::*;
use diesel::sql_types::BigInt;
use diesel::sqlite::SqliteConnection;
use diesel::QueryableByName;

#[derive(QueryableByName)]
struct PrunedSeqRow {
  #[diesel(sql_type = BigInt)]
  last_pruned_seq: i64,
}

pub fn validate_since_seq(since_seq: i64, last_pruned_seq: i64) -> Result<(), SyncMsg> {
  if since_seq < last_pruned_seq {
    return Err(SyncMsg::Nack {
      reason: "cursor_pruned".to_string(),
      recoverable: false,
    });
  }
  Ok(())
}

pub fn validate_since_seq_from_db(conn: &mut SqliteConnection, since_seq: i64) -> Result<(), SyncMsg> {
  let rows: Vec<PrunedSeqRow> =
    diesel::sql_query("SELECT COALESCE(last_pruned_seq, 0) AS last_pruned_seq FROM sync_gc_state WHERE id = 1")
      .load(conn)
      .unwrap_or_default();

  let last_pruned_seq = rows.first().map(|row| row.last_pruned_seq).unwrap_or(0);
  validate_since_seq(since_seq, last_pruned_seq)
}
