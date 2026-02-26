CREATE TABLE sync_meta (
    device_id TEXT PRIMARY KEY NOT NULL,
    protocol_version INTEGER NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE TABLE sync_changes (
    seq INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
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

CREATE TABLE sync_peer_cursor (
    peer_device_id TEXT PRIMARY KEY NOT NULL,
    last_acked_seq BIGINT NOT NULL DEFAULT 0,
    last_applied_seq BIGINT NOT NULL DEFAULT 0,
    is_trusted BOOLEAN NOT NULL DEFAULT FALSE,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE TABLE sync_pending_apply (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    source_device_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    row_id TEXT NOT NULL,
    op TEXT NOT NULL,
    hlc_wall_ms BIGINT NOT NULL,
    hlc_counter INTEGER NOT NULL,
    updated_at BIGINT NOT NULL,
    row_json TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_attempt_at BIGINT,
    last_error TEXT,
    created_at BIGINT NOT NULL
);

CREATE TABLE sync_dead_letter (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    source_device_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    row_id TEXT NOT NULL,
    op TEXT NOT NULL,
    hlc_wall_ms BIGINT NOT NULL,
    hlc_counter INTEGER NOT NULL,
    updated_at BIGINT NOT NULL,
    row_json TEXT,
    retry_count INTEGER NOT NULL,
    failure_reason TEXT NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE TABLE sync_gc_state (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
    last_pruned_seq BIGINT NOT NULL DEFAULT 0,
    updated_at BIGINT NOT NULL
);

CREATE TABLE sync_conflict_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    table_name TEXT NOT NULL,
    row_id TEXT NOT NULL,
    local_hlc_wall_ms BIGINT NOT NULL,
    local_hlc_counter INTEGER NOT NULL,
    remote_hlc_wall_ms BIGINT NOT NULL,
    remote_hlc_counter INTEGER NOT NULL,
    resolution TEXT NOT NULL,
    details_json TEXT,
    created_at BIGINT NOT NULL
);

CREATE TABLE sync_blob_refs (
    blob_hash TEXT PRIMARY KEY NOT NULL,
    local_rel_path TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    ref_count INTEGER NOT NULL DEFAULT 0,
    last_seen_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE INDEX idx_sync_changes_source_seq ON sync_changes (source_device_id, seq);
CREATE INDEX idx_sync_changes_entity ON sync_changes (table_name, row_id, seq);
CREATE INDEX idx_sync_pending_retry ON sync_pending_apply (next_attempt_at, retry_count);
CREATE INDEX idx_sync_dead_letter_entity ON sync_dead_letter (table_name, row_id, id);
