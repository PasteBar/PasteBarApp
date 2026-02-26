# PasteBar Sync v2.1

This document summarizes the current sync architecture in `src-tauri/src/sync`.

## Goals

- Keep sync optional and disabled by default.
- Support device-to-device convergence for database row changes.
- Prevent trigger ping-pong during remote apply.
- Support snapshot bootstrap + incremental catch-up.
- Add encrypted payload transport envelope and recovery-key lifecycle primitives.
- Track media blob references and garbage collect unreferenced blobs.

## Current Modules

- `config.rs`, `types.rs`: sync mode config (`Off`, `On`, `Paused`).
- `engine.rs`: runtime lifecycle for discovery/transport and sync stats exposure.
- `commands.rs`: sync mode commands and recovery key export/import helpers.
- `hlc.rs`, `hlc_sqlite.rs`: HLC ordering and SQLite scalar function registration.
- `apply_context.rs`: remote-apply trigger suppression context.
- `apply.rs`, `pending.rs`: idempotent apply decisions and pending/dead-letter handling.
- `snapshot.rs`: snapshot manifest generation with checkpoint sequence.
- `cursor.rs`, `gc.rs`: cursor validation and compaction floor logic.
- `media.rs`: missing-blob fetch queue, blob reference accounting, blob GC.
- `security/*`: data key generation, encrypted envelope, pairing store.
- `observability.rs`: `SyncStats` aggregation for applied/pending/dead-letter counts.

## Data Model Additions

Migration `2026-02-26-170000_create_sync_core` introduces:

- `sync_meta`
- `sync_changes`
- `sync_peer_cursor`
- `sync_pending_apply`
- `sync_dead_letter`
- `sync_gc_state`
- `sync_conflict_log`
- `sync_blob_refs`

Migration `2026-02-26-180500_sync_triggers` introduces trigger-driven outbox writes.

## Safety Defaults

- SQLite WAL enabled in runtime connection options.
- Busy timeout configured.
- Sync default mode remains `Off`.
- Remote apply context suppresses outbox trigger emission.

## Verification

Key sync tests live in `src-tauri/src/main.rs` under `sync_plan_tests`.
Run:

```bash
cargo test sync_plan_tests --manifest-path src-tauri/Cargo.toml
```

