use diesel::prelude::*;
use diesel::sql_types::{BigInt, Bool};
use diesel::sqlite::SqliteConnection;
use diesel::QueryableByName;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PeerCursor {
  pub last_applied_seq: i64,
  pub is_trusted: bool,
  pub is_stale: bool,
}

#[derive(QueryableByName)]
struct PeerCursorRow {
  #[diesel(sql_type = BigInt)]
  last_applied_seq: i64,
  #[diesel(sql_type = Bool)]
  is_trusted: bool,
  #[diesel(sql_type = Bool)]
  is_stale: bool,
}

pub fn compaction_floor(peers: &[PeerCursor]) -> Option<i64> {
  peers
    .iter()
    .filter(|peer| peer.is_trusted && !peer.is_stale)
    .map(|peer| peer.last_applied_seq)
    .min()
}

pub fn compaction_floor_from_db(conn: &mut SqliteConnection) -> QueryResult<Option<i64>> {
  let rows: Vec<PeerCursorRow> = diesel::sql_query(
    "SELECT last_applied_seq, is_trusted, is_stale
     FROM sync_peer_cursor",
  )
  .load(conn)?;

  let peers: Vec<PeerCursor> = rows
    .into_iter()
    .map(|row| PeerCursor {
      last_applied_seq: row.last_applied_seq,
      is_trusted: row.is_trusted,
      is_stale: row.is_stale,
    })
    .collect();

  Ok(compaction_floor(&peers))
}

pub fn compact_outbox_to_floor(
  conn: &mut SqliteConnection,
  floor_seq: i64,
  now_ms: i64,
) -> QueryResult<usize> {
  let deleted = diesel::sql_query("DELETE FROM sync_changes WHERE seq <= ?")
    .bind::<BigInt, _>(floor_seq)
    .execute(conn)?;

  diesel::sql_query(
    "INSERT INTO sync_gc_state (id, last_pruned_seq, updated_at)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       last_pruned_seq = excluded.last_pruned_seq,
       updated_at = excluded.updated_at",
  )
  .bind::<BigInt, _>(floor_seq)
  .bind::<BigInt, _>(now_ms)
  .execute(conn)?;

  Ok(deleted)
}
