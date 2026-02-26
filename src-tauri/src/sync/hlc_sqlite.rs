use diesel::result::QueryResult;
use diesel::sql_types::{BigInt, Integer};
use diesel::sqlite::SqliteConnection;
use std::sync::atomic::{AtomicI32, Ordering};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

static HLC_COUNTER: AtomicI32 = AtomicI32::new(0);

fn get_hlc_wall_ms() -> i64 {
  let now = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default();
  now.as_millis() as i64
}

fn get_hlc_counter() -> i32 {
  let next = HLC_COUNTER.fetch_add(1, Ordering::SeqCst).wrapping_add(1);
  if next <= 0 {
    HLC_COUNTER.store(1, Ordering::SeqCst);
    1
  } else {
    next
  }
}

pub fn register_hlc_sql_functions(conn: &mut SqliteConnection) -> QueryResult<()> {
  let suppression = Arc::new(AtomicI32::new(0));
  let suppression_reader = Arc::clone(&suppression);
  let suppression_writer = Arc::clone(&suppression);

  conn.register_noarg_sql_function::<BigInt, i64, _>("get_hlc_wall_ms", true, get_hlc_wall_ms)?;
  conn.register_noarg_sql_function::<Integer, i32, _>("get_hlc_counter", false, get_hlc_counter)?;
  conn.register_noarg_sql_function::<Integer, i32, _>("sync_triggers_disabled", false, move || {
    suppression_reader.load(Ordering::SeqCst)
  })?;
  conn.register_sql_function::<Integer, Integer, i32, i32, _>(
    "set_sync_triggers_disabled",
    false,
    move |value| {
      let normalized = if value == 0 { 0 } else { 1 };
      suppression_writer.store(normalized, Ordering::SeqCst);
      normalized
    },
  )?;
  Ok(())
}
