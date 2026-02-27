# PasteBar Device Sync and Encryption Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build optional desktop LAN sync with end-to-end encrypted payload replication, relationally-safe apply, media sync via iroh-blobs, and recoverable local encrypted storage foundations.

**Architecture:** Implement an outbox-driven replication engine in `src-tauri/src/sync` using SQLite triggers, HLC ordering, pending-apply queues, and cursor-based transport over QUIC/mDNS. Prevent trigger ping-pong during remote apply with per-connection temp context, support bootstrap snapshots through SQLite Online Backup API, and add compaction + stale-peer recovery semantics. Integrate encryption envelope and key lifecycle using per-device trust/pairing and UDK wrapping.

**Tech Stack:** Rust (Tauri v1 backend), Diesel + SQLite (WAL), libsqlite3-sys custom scalar functions, SQL migrations, optional iroh-blobs for media, tokio async runtime, serde JSON protocol.

---

## Preconditions

1. Work in branch `v2/sync-client-data-db-level-encryption`.
2. Ensure Rust toolchain matches repo (`rust-version = 1.75.0`).
3. Do not enable sync by default; default mode must stay `off`.

## Approved Product Subplan: Sync UX and Data Behavior (v2.1 Addendum)

This section is an approved extension of the core sync/encryption plan and defines the UX behavior that implementation must follow.

### Product Decisions (Locked)

1. Sync remains optional and `off` by default.
2. Pairing uses a 6-digit code and temporary discoverability.
3. Discoverability window is 60 seconds; if pairing does not complete, state resets to non-discoverable and a new code is required.
4. `Clipboard history` uses hybrid policy:
   - Manual `Send to Sync` is always available.
   - Auto-sync for history is user-toggleable.
5. `Saved clips`, `boards`, and `tabs` auto-sync when sync is enabled.
6. First-pair bootstrap is per-type selectable:
   - Clipboard history
   - Saved clips
   - Boards and tabs
7. Conflict strategy is Last-Write-Wins (HLC/timestamp tuple ordering).
8. History auto-sync, when enabled, includes all entries (no implicit sensitive-content filtering in v2.1).

### User Workflow (Must Implement)

1. Single-device default:
   - Sync is off, no discovery/broadcast, neutral sync indicator.
2. Start sync:
   - User opens Sync Center and selects start/pair.
   - App generates 6-digit code and enters discoverable state for 60s.
3. Join from another device:
   - User enters code on second device.
   - On success both devices become paired/trusted and move to active sync mode.
4. Initial backfill:
   - During first pair, user chooses which data types to backfill.
   - Backfill runs once, then normal incremental sync continues.
5. Steady state:
   - Clips/boards/tabs auto-sync.
   - History follows manual + optional auto policy.
   - `Send to Sync` remains available from context actions.
6. Exit paths:
   - Disconnect specific peer: trust/session removed, local data remains.
   - Turn sync off globally: stop discovery/transport/jobs and return to single-device state immediately.

### UI/UX Requirements

1. Nav/Header:
   - Add Sync entry in navbar dropdown area with colored status dot.
   - Dot semantics: green=healthy synced, amber=needs attention, red=error, neutral=not configured/off.
2. Sync Center modal:
   - Dedicated modal flow for pairing, status, errors, retry, disconnect, reconnect, and toggling sync on/off.
   - Modal body scroll only; header remains pinned with explicit close control.
   - Keep list of discoverable devices for troubleshooting (include stale/offline markers if available).
3. Context menus:
   - Add `Send to Sync` action for history items and clip/item entities.
4. Status surface:
   - Show active peers, last sync time, pending/error counters, and actionable retry.

### Acceptance Criteria for This Subplan

1. A user can pair two devices within 60 seconds using a 6-digit code.
2. If code expires, device is non-discoverable until a new code is generated.
3. After pairing, selected backfill types sync successfully.
4. New clips/boards/tabs propagate automatically while sync is on.
5. History can be synced manually even when history auto-sync is off.
6. Turning sync off immediately stops replication and discovery without data loss.
7. UI exposes clear sync health and retry/disconnect controls.

### Task 1: Create Sync Module Skeleton and Feature Flagged Runtime Wiring

**Files:**
- Create: `src-tauri/src/sync/mod.rs`
- Create: `src-tauri/src/sync/types.rs`
- Create: `src-tauri/src/sync/state.rs`
- Create: `src-tauri/src/sync/config.rs`
- Modify: `src-tauri/src/main.rs`
- Test: `src-tauri/src/sync/mod.rs` (inline unit tests)

**Step 1: Write the failing test**

```rust
#[test]
fn default_sync_mode_is_off() {
    let cfg = crate::sync::config::SyncConfig::default();
    assert_eq!(cfg.mode, crate::sync::types::SyncMode::Off);
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test default_sync_mode_is_off --manifest-path src-tauri/Cargo.toml`
Expected: FAIL with module/type not found.

**Step 3: Write minimal implementation**

```rust
// src-tauri/src/sync/types.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SyncMode { Off, On, Paused }

// src-tauri/src/sync/config.rs
use super::types::SyncMode;
#[derive(Debug, Clone)]
pub struct SyncConfig { pub mode: SyncMode }
impl Default for SyncConfig {
    fn default() -> Self { Self { mode: SyncMode::Off } }
}
```

**Step 4: Run test to verify it passes**

Run: `cargo test default_sync_mode_is_off --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/sync/mod.rs src-tauri/src/sync/types.rs src-tauri/src/sync/state.rs src-tauri/src/sync/config.rs src-tauri/src/main.rs
git commit -m "feat(sync): add base sync module and default off mode"
```

### Task 2: Add Sync Metadata Tables and Baseline Migration

**Files:**
- Create: `migrations/<timestamp>_create_sync_core/up.sql`
- Create: `migrations/<timestamp>_create_sync_core/down.sql`
- Modify: `src-tauri/src/schema.rs`
- Test: `src-tauri/src/sync/tests/migration_sync_core.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn sync_core_tables_exist_after_migration() {
    let conn = crate::db::_establish_direct_db_connection();
    let sql = "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sync_meta','sync_changes','sync_peer_cursor','sync_pending_apply','sync_dead_letter','sync_gc_state','sync_conflict_log','sync_blob_refs')";
    let rows: Vec<(String,)> = diesel::sql_query(sql).load(&mut conn).unwrap();
    assert_eq!(rows.len(), 8);
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test sync_core_tables_exist_after_migration --manifest-path src-tauri/Cargo.toml`
Expected: FAIL with missing tables.

**Step 3: Write minimal implementation**

```sql
CREATE TABLE sync_meta (
  device_id TEXT PRIMARY KEY,
  protocol_version INTEGER NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE sync_changes (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  source_device_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  op TEXT NOT NULL,
  hlc_wall_ms BIGINT NOT NULL,
  hlc_counter INTEGER NOT NULL,
  updated_at BIGINT NOT NULL,
  row_json TEXT,
  created_at BIGINT NOT NULL
);

-- add remaining tables exactly per plan v2.1
```

**Step 4: Run test to verify it passes**

Run: `cargo test sync_core_tables_exist_after_migration --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add migrations src-tauri/src/schema.rs src-tauri/src/sync/tests/migration_sync_core.rs
git commit -m "feat(sync): add sync metadata schema and migration"
```

### Task 3: Register SQLite HLC Scalar Functions on Every Connection

**Files:**
- Modify: `src-tauri/src/db.rs`
- Create: `src-tauri/src/sync/hlc_sqlite.rs`
- Test: `src-tauri/src/sync/tests/hlc_sqlite_fn.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn sqlite_hlc_functions_are_available() {
    let mut conn = crate::db::_establish_direct_db_connection();
    let rows: Vec<(i64, i32)> = diesel::sql_query("SELECT get_hlc_wall_ms(), get_hlc_counter()")
        .load(&mut conn)
        .unwrap();
    assert_eq!(rows.len(), 1);
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test sqlite_hlc_functions_are_available --manifest-path src-tauri/Cargo.toml`
Expected: FAIL with no such function.

**Step 3: Write minimal implementation**

```rust
// register on connection acquire
// get_hlc_wall_ms -> current wall millis
// get_hlc_counter -> process-local atomic logical counter
```

**Step 4: Run test to verify it passes**

Run: `cargo test sqlite_hlc_functions_are_available --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/db.rs src-tauri/src/sync/hlc_sqlite.rs src-tauri/src/sync/tests/hlc_sqlite_fn.rs
git commit -m "feat(sync): register sqlite HLC scalar functions"
```

### Task 4: Enable WAL Mode for Sync-Capable Runtime and Verify Busy Semantics

**Files:**
- Modify: `src-tauri/src/db.rs`
- Test: `src-tauri/src/sync/tests/wal_mode.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn sqlite_journal_mode_is_wal() {
    let mut conn = crate::db::_establish_direct_db_connection();
    let rows: Vec<(String,)> = diesel::sql_query("PRAGMA journal_mode;").load(&mut conn).unwrap();
    assert_eq!(rows[0].0.to_lowercase(), "wal");
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test sqlite_journal_mode_is_wal --manifest-path src-tauri/Cargo.toml`
Expected: FAIL (`delete`/non-wal).

**Step 3: Write minimal implementation**

```rust
ConnectionOptions {
  enable_wal: true,
  enable_foreign_keys: false,
  busy_timeout: Some(Duration::from_secs(5)),
}
```

**Step 4: Run test to verify it passes**

Run: `cargo test sqlite_journal_mode_is_wal --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/db.rs src-tauri/src/sync/tests/wal_mode.rs
git commit -m "feat(sync): enable WAL mode for sync runtime"
```

### Task 5: Implement Trigger-Based Outbox with Apply-Context Suppression

**Files:**
- Create: `migrations/<timestamp>_sync_triggers/up.sql`
- Create: `migrations/<timestamp>_sync_triggers/down.sql`
- Create: `src-tauri/src/sync/apply_context.rs`
- Test: `src-tauri/src/sync/tests/trigger_ping_pong.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn remote_apply_context_does_not_emit_outbox_event() {
    // Arrange: create temp._sync_ctx with disable_triggers=1
    // Act: update an item row
    // Assert: sync_changes count unchanged
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test remote_apply_context_does_not_emit_outbox_event --manifest-path src-tauri/Cargo.toml`
Expected: FAIL because trigger still emits.

**Step 3: Write minimal implementation**

```sql
CREATE TRIGGER trg_items_sync_update
AFTER UPDATE ON items
WHEN COALESCE((SELECT disable_triggers FROM temp._sync_ctx LIMIT 1), 0) = 0
BEGIN
  INSERT INTO sync_changes (...)
  VALUES (... get_hlc_wall_ms(), get_hlc_counter(), ...);
END;
```

**Step 4: Run test to verify it passes**

Run: `cargo test remote_apply_context_does_not_emit_outbox_event --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add migrations src-tauri/src/sync/apply_context.rs src-tauri/src/sync/tests/trigger_ping_pong.rs
git commit -m "feat(sync): add outbox triggers with apply-context suppression"
```

### Task 6: Build Sync Mode Commands and Orchestrator State Transitions

**Files:**
- Create: `src-tauri/src/sync/engine.rs`
- Create: `src-tauri/src/sync/commands.rs`
- Modify: `src-tauri/src/main.rs`
- Test: `src-tauri/src/sync/tests/mode_transitions.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn switching_to_off_stops_sync_runtime() {
    // set mode on -> off
    // assert engine marks discovery/session schedulers stopped
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test switching_to_off_stops_sync_runtime --manifest-path src-tauri/Cargo.toml`
Expected: FAIL.

**Step 3: Write minimal implementation**

```rust
pub fn set_mode(&self, mode: SyncMode) -> Result<(), String> {
    match mode {
        SyncMode::Off => self.stop_all(),
        SyncMode::Paused => self.pause_all(),
        SyncMode::On => self.start_all(),
    }
}
```

**Step 4: Run test to verify it passes**

Run: `cargo test mode_transitions --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/sync/engine.rs src-tauri/src/sync/commands.rs src-tauri/src/main.rs src-tauri/src/sync/tests/mode_transitions.rs
git commit -m "feat(sync): add sync mode orchestration and commands"
```

### Task 7: Implement Protocol Contracts and Cursor-Pruned NACK Recovery Rule

**Files:**
- Create: `src-tauri/src/sync/protocol.rs`
- Create: `src-tauri/src/sync/cursor.rs`
- Test: `src-tauri/src/sync/tests/cursor_pruned_nack.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn request_below_pruned_seq_returns_cursor_pruned_nack() {
    // gc last_pruned_seq=100
    // peer asks since_seq=90
    // expect NACK { reason: "cursor_pruned", recoverable: false }
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test request_below_pruned_seq_returns_cursor_pruned_nack --manifest-path src-tauri/Cargo.toml`
Expected: FAIL.

**Step 3: Write minimal implementation**

```rust
if since_seq < last_pruned_seq {
    return SyncMsg::Nack { reason: "cursor_pruned".into(), recoverable: false };
}
```

**Step 4: Run test to verify it passes**

Run: `cargo test cursor_pruned_nack --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/sync/protocol.rs src-tauri/src/sync/cursor.rs src-tauri/src/sync/tests/cursor_pruned_nack.rs
git commit -m "feat(sync): enforce cursor-pruned nack semantics"
```

### Task 8: Implement HLC Comparator and Apply Idempotency Rules

**Files:**
- Create: `src-tauri/src/sync/hlc.rs`
- Modify: `src-tauri/src/sync/apply.rs`
- Test: `src-tauri/src/sync/tests/hlc_idempotency.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn identical_hlc_event_is_noop() {
    // local and remote tuples equal
    // apply returns Noop
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test identical_hlc_event_is_noop --manifest-path src-tauri/Cargo.toml`
Expected: FAIL.

**Step 3: Write minimal implementation**

```rust
pub fn compare_hlc(a: Hlc, b: Hlc) -> std::cmp::Ordering { /* tuple compare */ }
```

**Step 4: Run test to verify it passes**

Run: `cargo test hlc_idempotency --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/sync/hlc.rs src-tauri/src/sync/apply.rs src-tauri/src/sync/tests/hlc_idempotency.rs
git commit -m "feat(sync): add hlc compare and idempotent apply behavior"
```

### Task 9: Implement Pending Apply Queue with Dead-Letter Threshold

**Files:**
- Create: `src-tauri/src/sync/pending.rs`
- Modify: `src-tauri/src/sync/apply.rs`
- Test: `src-tauri/src/sync/tests/pending_dead_letter.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn pending_item_moves_to_dead_letter_after_max_retries() {
    // enqueue unresolved dependency
    // simulate retry > max
    // assert row exists in sync_dead_letter
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test pending_item_moves_to_dead_letter_after_max_retries --manifest-path src-tauri/Cargo.toml`
Expected: FAIL.

**Step 3: Write minimal implementation**

```rust
if item.retries >= MAX_RETRIES {
    move_to_dead_letter(item)?;
} else {
    reschedule_with_backoff(item)?;
}
```

**Step 4: Run test to verify it passes**

Run: `cargo test pending_dead_letter --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/sync/pending.rs src-tauri/src/sync/apply.rs src-tauri/src/sync/tests/pending_dead_letter.rs
git commit -m "feat(sync): add pending queue retries and dead-letter handling"
```

### Task 10: Implement Snapshot Manager with SQLite Backup API and Checkpoint Handoff

**Files:**
- Create: `src-tauri/src/sync/snapshot.rs`
- Modify: `src-tauri/src/sync/protocol.rs`
- Test: `src-tauri/src/sync/tests/snapshot_checkpoint.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn snapshot_manifest_contains_checkpoint_seq() {
    // generate snapshot
    // assert manifest.checkpoint_seq == max(sync_changes.seq) at start
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test snapshot_manifest_contains_checkpoint_seq --manifest-path src-tauri/Cargo.toml`
Expected: FAIL.

**Step 3: Write minimal implementation**

```rust
let checkpoint_seq = query_max_seq(conn)?;
let backup_path = create_sqlite_online_backup(conn)?;
```

**Step 4: Run test to verify it passes**

Run: `cargo test snapshot_checkpoint --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/sync/snapshot.rs src-tauri/src/sync/protocol.rs src-tauri/src/sync/tests/snapshot_checkpoint.rs
git commit -m "feat(sync): add snapshot manager with checkpoint handoff"
```

### Task 11: Implement Outbox Compaction with Stale-Peer Watermark Rules

**Files:**
- Create: `src-tauri/src/sync/gc.rs`
- Modify: `src-tauri/src/sync/cursor.rs`
- Test: `src-tauri/src/sync/tests/compaction_floor.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn compaction_uses_min_trusted_non_stale_cursor() {
    // peers: 500, 700(stale), 620
    // safe prune floor expected = 500
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test compaction_uses_min_trusted_non_stale_cursor --manifest-path src-tauri/Cargo.toml`
Expected: FAIL.

**Step 3: Write minimal implementation**

```rust
let floor = peers.iter()
    .filter(|p| p.trusted && !p.is_stale(now))
    .map(|p| p.last_applied_seq)
    .min();
```

**Step 4: Run test to verify it passes**

Run: `cargo test compaction_floor --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/sync/gc.rs src-tauri/src/sync/cursor.rs src-tauri/src/sync/tests/compaction_floor.rs
git commit -m "feat(sync): add safe outbox compaction and stale peer handling"
```

### Task 12: Add QUIC/mDNS Discovery and Session Plumbing for Sync Engine

**Files:**
- Create: `src-tauri/src/sync/discovery.rs`
- Create: `src-tauri/src/sync/transport.rs`
- Modify: `src-tauri/src/sync/engine.rs`
- Test: `src-tauri/src/sync/tests/engine_network_state.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn sync_mode_on_starts_discovery_and_transport() {
    // set mode on
    // assert discovery and transport started flags true
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test sync_mode_on_starts_discovery_and_transport --manifest-path src-tauri/Cargo.toml`
Expected: FAIL.

**Step 3: Write minimal implementation**

```rust
if mode == SyncMode::On {
    self.discovery.start()?;
    self.transport.start()?;
}
```

**Step 4: Run test to verify it passes**

Run: `cargo test engine_network_state --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/sync/discovery.rs src-tauri/src/sync/transport.rs src-tauri/src/sync/engine.rs src-tauri/src/sync/tests/engine_network_state.rs
git commit -m "feat(sync): wire discovery and transport lifecycle"
```

### Task 13: Integrate iroh-blobs Media Reference Fetch + Blob Reference Accounting

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Create: `src-tauri/src/sync/media.rs`
- Modify: `src-tauri/src/services/items_service.rs`
- Modify: `src-tauri/src/services/history_service.rs`
- Test: `src-tauri/src/sync/tests/media_ref_fetch.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn missing_blob_hash_triggers_media_fetch_job() {
    // apply row with image_hash not present locally
    // assert fetch job scheduled
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test missing_blob_hash_triggers_media_fetch_job --manifest-path src-tauri/Cargo.toml`
Expected: FAIL.

**Step 3: Write minimal implementation**

```rust
pub fn ensure_blob_available(hash: &str) -> Result<(), String> {
    if !local_blob_exists(hash) {
        enqueue_blob_fetch(hash)?;
    }
    Ok(())
}
```

**Step 4: Run test to verify it passes**

Run: `cargo test media_ref_fetch --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/sync/media.rs src-tauri/src/services/items_service.rs src-tauri/src/services/history_service.rs src-tauri/src/sync/tests/media_ref_fetch.rs
git commit -m "feat(sync): add iroh-blobs media reference fetch and accounting"
```

### Task 14: Implement Media and Blob Garbage Collection

**Files:**
- Modify: `src-tauri/src/sync/media.rs`
- Create: `src-tauri/src/sync/tests/blob_gc.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn unreferenced_blob_is_removed_by_gc() {
    // ref_count=0
    // run gc
    // assert blob removed from iroh store and local media map
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test unreferenced_blob_is_removed_by_gc --manifest-path src-tauri/Cargo.toml`
Expected: FAIL.

**Step 3: Write minimal implementation**

```rust
for blob in unreferenced_blobs()? {
    delete_local_blob(blob.hash)?;
    delete_iroh_blob(blob.hash)?;
}
```

**Step 4: Run test to verify it passes**

Run: `cargo test blob_gc --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/sync/media.rs src-tauri/src/sync/tests/blob_gc.rs
git commit -m "feat(sync): add blob and media garbage collection"
```

### Task 15: Implement Trust Pairing and Encrypted Message Envelope

**Files:**
- Create: `src-tauri/src/sync/security/mod.rs`
- Create: `src-tauri/src/sync/security/keys.rs`
- Create: `src-tauri/src/sync/security/envelope.rs`
- Create: `src-tauri/src/sync/security/pairing.rs`
- Test: `src-tauri/src/sync/tests/encrypted_envelope.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn encrypted_envelope_roundtrip_succeeds() {
    // encrypt payload then decrypt
    // assert original bytes recovered
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test encrypted_envelope_roundtrip_succeeds --manifest-path src-tauri/Cargo.toml`
Expected: FAIL.

**Step 3: Write minimal implementation**

```rust
pub fn encrypt(payload: &[u8], key: &[u8]) -> Envelope { /* AEAD encrypt */ }
pub fn decrypt(env: &Envelope, key: &[u8]) -> Result<Vec<u8>, String> { /* AEAD decrypt */ }
```

**Step 4: Run test to verify it passes**

Run: `cargo test encrypted_envelope_roundtrip_succeeds --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/sync/security src-tauri/src/sync/tests/encrypted_envelope.rs
git commit -m "feat(sync): add pairing and encrypted sync envelope"
```

### Task 16: Add Recovery Key Flows and Key Lifecycle Commands

**Files:**
- Modify: `src-tauri/src/sync/security/keys.rs`
- Modify: `src-tauri/src/sync/commands.rs`
- Test: `src-tauri/src/sync/tests/recovery_key.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn recovery_key_can_restore_wrapped_udk() {
    // wrap udk with recovery key
    // unwrap and assert equality
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test recovery_key_can_restore_wrapped_udk --manifest-path src-tauri/Cargo.toml`
Expected: FAIL.

**Step 3: Write minimal implementation**

```rust
pub fn export_recovery_key() -> String { /* generate and return */ }
pub fn import_recovery_key(key: &str) -> Result<(), String> { /* verify and store */ }
```

**Step 4: Run test to verify it passes**

Run: `cargo test recovery_key --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/sync/security/keys.rs src-tauri/src/sync/commands.rs src-tauri/src/sync/tests/recovery_key.rs
git commit -m "feat(sync): add recovery key export/import lifecycle"
```

### Task 17: Add Diagnostics, Metrics, and End-to-End Integration Tests

**Files:**
- Create: `src-tauri/src/sync/observability.rs`
- Create: `src-tauri/src/sync/tests/e2e_two_device.rs`
- Modify: `src-tauri/src/sync/engine.rs`

**Step 1: Write the failing test**

```rust
#[test]
fn two_device_incremental_sync_converges() {
    // simulate device A write and B replication
    // assert rows converge and cursor advances
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test two_device_incremental_sync_converges --manifest-path src-tauri/Cargo.toml -- --nocapture`
Expected: FAIL.

**Step 3: Write minimal implementation**

```rust
pub struct SyncStats {
    pub applied_events: u64,
    pub pending_events: u64,
    pub dead_letter_events: u64,
}
```

**Step 4: Run test to verify it passes**

Run: `cargo test sync --manifest-path src-tauri/Cargo.toml -- --nocapture`
Expected: PASS for new sync tests.

**Step 5: Commit**

```bash
git add src-tauri/src/sync/observability.rs src-tauri/src/sync/tests/e2e_two_device.rs src-tauri/src/sync/engine.rs
git commit -m "test(sync): add integration convergence and diagnostics"
```

### Task 18: Final Verification Pass and Documentation

**Files:**
- Create: `docs/sync/README.md`
- Create: `docs/sync/protocol-v2.1.md`
- Create: `docs/sync/operations.md`

**Step 1: Write the failing test**

```rust
#[test]
fn sync_mode_default_off_regression_guard() {
    assert_eq!(crate::sync::config::SyncConfig::default().mode, crate::sync::types::SyncMode::Off);
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test sync_mode_default_off_regression_guard --manifest-path src-tauri/Cargo.toml`
Expected: FAIL only if regression introduced.

**Step 3: Write minimal implementation**

```rust
// keep default off behavior unchanged if needed by regression
```

**Step 4: Run test to verify it passes**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: PASS for all repo tests relevant to current platform.

**Step 5: Commit**

```bash
git add docs/sync src-tauri/src/sync
git commit -m "docs(sync): add protocol, operations, and verification docs"
```

## Verification Checklist (Must complete before merge)

1. Sync defaults to `off` after clean start and upgrade.
2. Remote apply does not emit outbox events (no ping-pong loop).
3. HLC fields are always populated in `sync_changes`.
4. `cursor_pruned` NACK path forces snapshot re-bootstrap.
5. Snapshot handoff remains idempotent under concurrent writes.
6. Pending queue promotes to dead-letter after max retries.
7. Compaction never prunes beyond trusted non-stale floor.
8. Unreferenced blobs are cleaned from both app media and iroh store.
9. Recovery key can restore wrapped UDK locally.

## Notes for Implementer

- Keep steps small; do not bundle multiple behavior changes into one commit.
- Use @superpowers/test-driven-development for every behavior change.
- Use deterministic tests for clock/time and sequence logic.
- Ensure sync-only code paths do not degrade normal PasteBar operation when sync mode is `off`.
