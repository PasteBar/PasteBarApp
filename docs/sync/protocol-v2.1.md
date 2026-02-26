# PasteBar Sync Protocol v2.1

## Scope

This protocol focuses on database row replication semantics and recovery paths.
Transport and peer discovery are pluggable runtime concerns.

## Core Concepts

- `seq`: monotonic local outbox sequence in `sync_changes`.
- HLC tuple: `(hlc_wall_ms, hlc_counter)` for conflict ordering.
- Cursor: per-peer applied/acked sequence in `sync_peer_cursor`.
- Snapshot checkpoint: `checkpoint_seq` captured in snapshot manifest.

## Message Semantics

## `Nack`

```json
{
  "type": "Nack",
  "reason": "cursor_pruned",
  "recoverable": false
}
```

When peer requests `since_seq` lower than local `last_pruned_seq`, sender returns
`cursor_pruned` and receiver must perform snapshot bootstrap.

## `SnapshotManifest`

Current model includes:

- `checkpoint_seq`
- `snapshot_created_at_ms`
- `snapshot_file_path`

Receiver applies snapshot first, then incremental stream from `checkpoint_seq`.
Duplicate row delivery is safe under idempotent apply rules.

## Apply Semantics

- Remote apply uses suppression context to avoid trigger ping-pong.
- Idempotency:
  - remote HLC > local HLC => apply
  - remote HLC <= local HLC => noop
- Dependency failures move items through pending queue with retry policy.
- Retry overflow moves record to dead-letter table.

## Compaction

- Safe prune floor = minimum `last_applied_seq` across trusted, non-stale peers.
- Stale peers are excluded from floor calculation.
- If a peer cursor falls below pruned floor, it must re-bootstrap by snapshot.

## Security Envelope

Payload-level envelope uses AEAD (ChaCha20-Poly1305):

- random 96-bit nonce
- authenticated ciphertext
- explicit envelope version

Recovery-key primitives support wrapping/unwrapping data keys for recovery flows.

