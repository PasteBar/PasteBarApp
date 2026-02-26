use diesel::prelude::*;
use diesel::result::QueryResult;
use diesel::sqlite::SqliteConnection;

pub fn initialize_apply_context(conn: &mut SqliteConnection) -> QueryResult<()> {
  diesel::sql_query("SELECT set_sync_triggers_disabled(0)")
    .execute(conn)
    .map(|_| ())
}

pub fn enable_remote_apply_context(conn: &mut SqliteConnection) -> QueryResult<()> {
  diesel::sql_query("SELECT set_sync_triggers_disabled(1)")
    .execute(conn)
    .map(|_| ())
}

pub fn disable_remote_apply_context(conn: &mut SqliteConnection) -> QueryResult<()> {
  diesel::sql_query("SELECT set_sync_triggers_disabled(0)")
    .execute(conn)
    .map(|_| ())
}
