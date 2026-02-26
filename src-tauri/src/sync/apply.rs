use std::cmp::Ordering;

use super::hlc::{compare_hlc, Hlc};
use super::pending::{process_pending_retry, PendingProcessResult};
use diesel::result::QueryResult;
use diesel::sqlite::SqliteConnection;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ApplyDecision {
  ApplyRemote,
  Noop,
}

pub fn idempotent_apply_decision(local: Hlc, remote: Hlc) -> ApplyDecision {
  match compare_hlc(remote, local) {
    Ordering::Greater => ApplyDecision::ApplyRemote,
    Ordering::Equal | Ordering::Less => ApplyDecision::Noop,
  }
}

pub fn on_apply_dependency_failure(
  conn: &mut SqliteConnection,
  pending_id: i32,
  max_retries: i32,
  failure_reason: &str,
) -> QueryResult<PendingProcessResult> {
  process_pending_retry(conn, pending_id, max_retries, failure_reason)
}
