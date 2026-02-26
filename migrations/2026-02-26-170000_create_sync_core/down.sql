DROP INDEX IF EXISTS idx_sync_dead_letter_entity;
DROP INDEX IF EXISTS idx_sync_pending_retry;
DROP INDEX IF EXISTS idx_sync_changes_entity;
DROP INDEX IF EXISTS idx_sync_changes_source_seq;

DROP TABLE IF EXISTS sync_blob_refs;
DROP TABLE IF EXISTS sync_conflict_log;
DROP TABLE IF EXISTS sync_gc_state;
DROP TABLE IF EXISTS sync_dead_letter;
DROP TABLE IF EXISTS sync_pending_apply;
DROP TABLE IF EXISTS sync_peer_cursor;
DROP TABLE IF EXISTS sync_changes;
DROP TABLE IF EXISTS sync_meta;
