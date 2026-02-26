use diesel::result::QueryResult;
use diesel::sqlite::SqliteConnection;
use diesel::RunQueryDsl;

pub fn initialize_apply_context(conn: &mut SqliteConnection) -> QueryResult<()> {
  set_sync_triggers_disabled(conn, 0)
}

pub struct RemoteApplyGuard<'a> {
  conn: &'a mut SqliteConnection,
}

impl<'a> RemoteApplyGuard<'a> {
  pub fn conn_mut(&mut self) -> &mut SqliteConnection {
    self.conn
  }
}

impl<'a> Drop for RemoteApplyGuard<'a> {
  fn drop(&mut self) {
    let _ = set_sync_triggers_disabled(self.conn, 0);
  }
}

pub fn enable_remote_apply_context(
  conn: &mut SqliteConnection,
) -> QueryResult<RemoteApplyGuard<'_>> {
  set_sync_triggers_disabled(conn, 1)?;
  Ok(RemoteApplyGuard { conn })
}

fn set_sync_triggers_disabled(conn: &mut SqliteConnection, value: i32) -> QueryResult<()> {
  diesel::sql_query("SELECT set_sync_triggers_disabled(?)")
    .bind::<diesel::sql_types::Integer, _>(value)
    .execute(conn)
    .map(|_| ())
}
