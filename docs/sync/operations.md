# PasteBar Sync Operations Guide

## Runtime Modes

- `Off`: discovery/transport/schedulers stopped (default).
- `On`: discovery + transport running.
- `Paused`: runtime stopped without deleting sync metadata.

## Local Validation Commands

```bash
cargo test sync_plan_tests --manifest-path src-tauri/Cargo.toml
cargo test two_device_incremental_sync_converges --manifest-path src-tauri/Cargo.toml -- --nocapture
```

## Recovery Key Flow

- Generate/export recovery key:
  - `sync::commands::export_recovery_key()`
- Import recovery key:
  - `sync::commands::import_recovery_key(key_string)`
- Wrap and unwrap UDK:
  - `wrap_data_key_with_recovery_key`
  - `unwrap_data_key_with_recovery_key`

Operational rule: losing both local UDK and recovery key means encrypted payload
cannot be recovered.

## Snapshot + Incremental Handoff

1. Build snapshot manifest and checkpoint sequence.
2. Transfer snapshot to target device.
3. Apply incremental changes starting from `checkpoint_seq`.

If sender replies `cursor_pruned`, perform fresh snapshot bootstrap.

## Media Blob Operations

- Missing local blob hashes are queued for fetch.
- Blob references are tracked in `sync_blob_refs`.
- GC deletes blobs with `ref_count <= 0`:
  - delete local media file
  - delete from blob store
  - delete blob ref row

## Troubleshooting

- Outbox not growing for local writes:
  - verify apply suppression is not left enabled.
- Infinite outbox loop:
  - verify remote apply path enables/disables suppression correctly.
- Peer cannot catch up:
  - check for `cursor_pruned` and force snapshot re-bootstrap.
- Disk growth:
  - run blob GC and inspect `sync_dead_letter`/`sync_pending_apply`.

