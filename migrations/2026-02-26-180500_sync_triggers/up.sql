CREATE TRIGGER trg_items_sync_insert
AFTER INSERT ON items
WHEN sync_triggers_disabled() = 0
BEGIN
    INSERT INTO sync_changes (
        source_device_id,
        table_name,
        row_id,
        op,
        hlc_wall_ms,
        hlc_counter,
        updated_at,
        row_json,
        created_at
    )
    VALUES (
        COALESCE((SELECT device_id FROM sync_meta LIMIT 1), 'local'),
        'items',
        NEW.item_id,
        'insert',
        get_hlc_wall_ms(),
        get_hlc_counter(),
        NEW.updated_at,
        NULL,
        get_hlc_wall_ms()
    );
END;

CREATE TRIGGER trg_items_sync_update
AFTER UPDATE ON items
WHEN sync_triggers_disabled() = 0
BEGIN
    INSERT INTO sync_changes (
        source_device_id,
        table_name,
        row_id,
        op,
        hlc_wall_ms,
        hlc_counter,
        updated_at,
        row_json,
        created_at
    )
    VALUES (
        COALESCE((SELECT device_id FROM sync_meta LIMIT 1), 'local'),
        'items',
        NEW.item_id,
        'update',
        get_hlc_wall_ms(),
        get_hlc_counter(),
        NEW.updated_at,
        NULL,
        get_hlc_wall_ms()
    );
END;

CREATE TRIGGER trg_items_sync_delete
AFTER DELETE ON items
WHEN sync_triggers_disabled() = 0
BEGIN
    INSERT INTO sync_changes (
        source_device_id,
        table_name,
        row_id,
        op,
        hlc_wall_ms,
        hlc_counter,
        updated_at,
        row_json,
        created_at
    )
    VALUES (
        COALESCE((SELECT device_id FROM sync_meta LIMIT 1), 'local'),
        'items',
        OLD.item_id,
        'delete',
        get_hlc_wall_ms(),
        get_hlc_counter(),
        OLD.updated_at,
        NULL,
        get_hlc_wall_ms()
    );
END;
