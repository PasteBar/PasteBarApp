use chrono::NaiveDateTime;
use diesel::prelude::*;
use diesel::sql_types::{BigInt, Bool, Integer, Nullable, Text, Timestamp};
use diesel::sqlite::SqliteConnection;
use diesel::QueryableByName;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct HistorySyncChange {
  pub seq: i64,
  pub source_device_id: String,
  pub op: String,
  pub row_id: String,
  pub hlc_wall_ms: i64,
  pub hlc_counter: i32,
  pub updated_at: i64,
  pub row_json: Option<String>,
}

#[derive(Debug, Deserialize)]
struct HistoryRowPayload {
  history_id: Option<String>,
  title: Option<String>,
  value: Option<String>,
  value_preview: Option<String>,
  value_more_preview_lines: Option<i32>,
  value_more_preview_chars: Option<i32>,
  value_hash: Option<String>,
  is_image: Option<bool>,
  is_masked: Option<bool>,
  is_text: Option<bool>,
  is_code: Option<bool>,
  is_link: Option<bool>,
  is_video: Option<bool>,
  has_emoji: Option<bool>,
  has_masked_words: Option<bool>,
  is_pinned: Option<bool>,
  is_favorite: Option<bool>,
  links: Option<String>,
  detected_language: Option<String>,
  pinned_order_number: Option<i32>,
  created_at: Option<i64>,
  updated_at: Option<i64>,
  history_options: Option<String>,
  copied_from_app: Option<String>,
}

#[derive(QueryableByName)]
struct ExistingUpdatedAtRow {
  #[diesel(sql_type = BigInt)]
  updated_at: i64,
}

#[derive(QueryableByName)]
struct ChangeRow {
  #[diesel(sql_type = BigInt)]
  seq: i64,
  #[diesel(sql_type = Text)]
  source_device_id: String,
  #[diesel(sql_type = Text)]
  op: String,
  #[diesel(sql_type = Text)]
  row_id: String,
  #[diesel(sql_type = BigInt)]
  hlc_wall_ms: i64,
  #[diesel(sql_type = Integer)]
  hlc_counter: i32,
  #[diesel(sql_type = BigInt)]
  updated_at: i64,
  #[diesel(sql_type = Nullable<Text>)]
  row_json: Option<String>,
}

pub fn load_history_changes_since(
  conn: &mut SqliteConnection,
  since_seq: i64,
  limit: i64,
) -> Result<Vec<HistorySyncChange>, String> {
  let rows: Vec<ChangeRow> = diesel::sql_query(
    "SELECT
      CAST(seq AS BIGINT) AS seq,
      source_device_id,
      op,
      row_id,
      hlc_wall_ms,
      hlc_counter,
      updated_at,
      row_json
     FROM sync_changes
     WHERE table_name = 'clipboard_history'
       AND CAST(seq AS BIGINT) > ?
     ORDER BY seq ASC
     LIMIT ?",
  )
  .bind::<BigInt, _>(since_seq)
  .bind::<BigInt, _>(limit)
  .load(conn)
  .map_err(|e| e.to_string())?;

  Ok(
    rows
      .into_iter()
      .map(|row| HistorySyncChange {
        seq: row.seq,
        source_device_id: row.source_device_id,
        op: row.op,
        row_id: row.row_id,
        hlc_wall_ms: row.hlc_wall_ms,
        hlc_counter: row.hlc_counter,
        updated_at: row.updated_at,
        row_json: row.row_json,
      })
      .collect(),
  )
}

pub fn apply_history_change(
  conn: &mut SqliteConnection,
  change: &HistorySyncChange,
) -> Result<(), String> {
  let history_id = change.row_id.clone();
  let current_updated_at = current_history_updated_at(conn, &history_id)?;
  let effective_updated_at = change.updated_at;

  if let Some(existing_updated_at) = current_updated_at {
    if existing_updated_at >= effective_updated_at {
      return Ok(());
    }
  }

  if change.op == "delete" {
    diesel::sql_query("DELETE FROM clipboard_history WHERE history_id = ?")
      .bind::<Text, _>(history_id)
      .execute(conn)
      .map_err(|e| e.to_string())?;
    return Ok(());
  }

  let row_json = change
    .row_json
    .as_ref()
    .ok_or_else(|| "Missing row_json payload for non-delete history change".to_string())?;
  let payload: HistoryRowPayload =
    serde_json::from_str(row_json).map_err(|e| format!("Invalid history row_json: {}", e))?;

  let history_id = payload.history_id.unwrap_or(change.row_id.clone());
  let created_at = payload.created_at.unwrap_or(change.updated_at);
  let updated_at = payload.updated_at.unwrap_or(change.updated_at);
  let created_date = timestamp_from_millis(created_at);
  let updated_date = timestamp_from_millis(updated_at);

  diesel::sql_query(
    "INSERT INTO clipboard_history (
      history_id,
      title,
      value,
      value_preview,
      value_more_preview_lines,
      value_more_preview_chars,
      value_hash,
      is_image,
      is_masked,
      is_text,
      is_code,
      is_link,
      is_video,
      has_emoji,
      has_masked_words,
      is_pinned,
      is_favorite,
      links,
      detected_language,
      pinned_order_number,
      created_at,
      updated_at,
      created_date,
      updated_date,
      history_options,
      copied_from_app
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(history_id) DO UPDATE SET
      title = excluded.title,
      value = excluded.value,
      value_preview = excluded.value_preview,
      value_more_preview_lines = excluded.value_more_preview_lines,
      value_more_preview_chars = excluded.value_more_preview_chars,
      value_hash = excluded.value_hash,
      is_image = excluded.is_image,
      is_masked = excluded.is_masked,
      is_text = excluded.is_text,
      is_code = excluded.is_code,
      is_link = excluded.is_link,
      is_video = excluded.is_video,
      has_emoji = excluded.has_emoji,
      has_masked_words = excluded.has_masked_words,
      is_pinned = excluded.is_pinned,
      is_favorite = excluded.is_favorite,
      links = excluded.links,
      detected_language = excluded.detected_language,
      pinned_order_number = excluded.pinned_order_number,
      updated_at = excluded.updated_at,
      updated_date = excluded.updated_date,
      history_options = excluded.history_options,
      copied_from_app = excluded.copied_from_app
    WHERE excluded.updated_at > clipboard_history.updated_at",
  )
  .bind::<Text, _>(history_id)
  .bind::<Nullable<Text>, _>(payload.title)
  .bind::<Nullable<Text>, _>(payload.value)
  .bind::<Nullable<Text>, _>(payload.value_preview)
  .bind::<Nullable<Integer>, _>(payload.value_more_preview_lines)
  .bind::<Nullable<Integer>, _>(payload.value_more_preview_chars)
  .bind::<Nullable<Text>, _>(payload.value_hash)
  .bind::<Nullable<Bool>, _>(payload.is_image)
  .bind::<Nullable<Bool>, _>(payload.is_masked)
  .bind::<Nullable<Bool>, _>(payload.is_text)
  .bind::<Nullable<Bool>, _>(payload.is_code)
  .bind::<Nullable<Bool>, _>(payload.is_link)
  .bind::<Nullable<Bool>, _>(payload.is_video)
  .bind::<Nullable<Bool>, _>(payload.has_emoji)
  .bind::<Nullable<Bool>, _>(payload.has_masked_words)
  .bind::<Nullable<Bool>, _>(payload.is_pinned)
  .bind::<Nullable<Bool>, _>(payload.is_favorite)
  .bind::<Nullable<Text>, _>(payload.links)
  .bind::<Nullable<Text>, _>(payload.detected_language)
  .bind::<Nullable<Integer>, _>(payload.pinned_order_number)
  .bind::<BigInt, _>(created_at)
  .bind::<BigInt, _>(updated_at)
  .bind::<Timestamp, _>(created_date)
  .bind::<Timestamp, _>(updated_date)
  .bind::<Nullable<Text>, _>(payload.history_options)
  .bind::<Nullable<Text>, _>(payload.copied_from_app)
  .execute(conn)
  .map_err(|e| e.to_string())?;

  Ok(())
}

pub fn apply_history_changes(
  conn: &mut SqliteConnection,
  changes: &[HistorySyncChange],
) -> Result<(usize, i64), String> {
  let mut applied = 0usize;
  let mut last_applied_seq = 0i64;

  for change in changes {
    apply_history_change(conn, change)?;
    applied += 1;
    if change.seq > last_applied_seq {
      last_applied_seq = change.seq;
    }
  }

  Ok((applied, last_applied_seq))
}

fn current_history_updated_at(
  conn: &mut SqliteConnection,
  history_id: &str,
) -> Result<Option<i64>, String> {
  let rows: Vec<ExistingUpdatedAtRow> = diesel::sql_query(
    "SELECT updated_at
     FROM clipboard_history
     WHERE history_id = ?
     LIMIT 1",
  )
  .bind::<Text, _>(history_id.to_string())
  .load(conn)
  .map_err(|e| e.to_string())?;

  Ok(rows.first().map(|row| row.updated_at))
}

fn timestamp_from_millis(millis: i64) -> NaiveDateTime {
  NaiveDateTime::from_timestamp_opt(millis / 1000, 0)
    .unwrap_or_else(|| NaiveDateTime::from_timestamp_opt(0, 0).expect("unix epoch must exist"))
}
