use diesel::prelude::*;
use diesel::result::{Error as DieselError, QueryResult};
use diesel::sql_types::{BigInt, Integer, Nullable, Text};
use diesel::sqlite::SqliteConnection;
use diesel::QueryableByName;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PendingProcessResult {
  Retried { retry_count: i32 },
  MovedToDeadLetter,
}

#[derive(QueryableByName)]
struct PendingRow {
  #[diesel(sql_type = Integer)]
  id: i32,
  #[diesel(sql_type = Text)]
  source_device_id: String,
  #[diesel(sql_type = Text)]
  table_name: String,
  #[diesel(sql_type = Text)]
  row_id: String,
  #[diesel(sql_type = Text)]
  op: String,
  #[diesel(sql_type = BigInt)]
  hlc_wall_ms: i64,
  #[diesel(sql_type = Integer)]
  hlc_counter: i32,
  #[diesel(sql_type = BigInt)]
  updated_at: i64,
  #[diesel(sql_type = Nullable<Text>)]
  row_json: Option<String>,
  #[diesel(sql_type = Integer)]
  retry_count: i32,
  #[diesel(sql_type = BigInt)]
  created_at: i64,
}

pub fn process_pending_retry(
  conn: &mut SqliteConnection,
  pending_id: i32,
  max_retries: i32,
  failure_reason: &str,
) -> QueryResult<PendingProcessResult> {
  let rows: Vec<PendingRow> = diesel::sql_query(
    "SELECT id, source_device_id, table_name, row_id, op, hlc_wall_ms, hlc_counter, updated_at, row_json, retry_count, created_at
     FROM sync_pending_apply
     WHERE id = ?",
  )
  .bind::<Integer, _>(pending_id)
  .load(conn)?;

  let row = rows.into_iter().next().ok_or(DieselError::NotFound)?;
  let next_retry = row.retry_count + 1;

  if next_retry > max_retries {
    return conn.transaction(|transaction_conn| {
      diesel::sql_query(
        "INSERT INTO sync_dead_letter (
           source_device_id, table_name, row_id, op, hlc_wall_ms, hlc_counter, updated_at, row_json, retry_count, failure_reason, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind::<Text, _>(row.source_device_id)
      .bind::<Text, _>(row.table_name)
      .bind::<Text, _>(row.row_id)
      .bind::<Text, _>(row.op)
      .bind::<BigInt, _>(row.hlc_wall_ms)
      .bind::<Integer, _>(row.hlc_counter)
      .bind::<BigInt, _>(row.updated_at)
      .bind::<Nullable<Text>, _>(row.row_json)
      .bind::<Integer, _>(next_retry)
      .bind::<Text, _>(failure_reason.to_string())
      .bind::<BigInt, _>(row.created_at)
      .execute(transaction_conn)?;

      diesel::sql_query("DELETE FROM sync_pending_apply WHERE id = ?")
        .bind::<Integer, _>(row.id)
        .execute(transaction_conn)?;

      Ok(PendingProcessResult::MovedToDeadLetter)
    });
  }

  diesel::sql_query(
    "UPDATE sync_pending_apply
     SET retry_count = ?, last_error = ?
     WHERE id = ?",
  )
  .bind::<Integer, _>(next_retry)
  .bind::<Nullable<Text>, _>(Some(failure_reason.to_string()))
  .bind::<Integer, _>(row.id)
  .execute(conn)?;

  Ok(PendingProcessResult::Retried {
    retry_count: next_retry,
  })
}
