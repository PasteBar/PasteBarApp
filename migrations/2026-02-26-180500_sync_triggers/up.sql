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

CREATE TRIGGER trg_clipboard_history_sync_insert
AFTER INSERT ON clipboard_history
WHEN sync_triggers_disabled() = 0 AND COALESCE(NEW.is_image, 0) = 0
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
        'clipboard_history',
        NEW.history_id,
        'insert',
        get_hlc_wall_ms(),
        get_hlc_counter(),
        NEW.updated_at,
        json_object(
          'history_id', NEW.history_id,
          'title', NEW.title,
          'value', NEW.value,
          'value_preview', NEW.value_preview,
          'value_more_preview_lines', NEW.value_more_preview_lines,
          'value_more_preview_chars', NEW.value_more_preview_chars,
          'value_hash', NEW.value_hash,
          'is_image', NEW.is_image,
          'is_masked', NEW.is_masked,
          'is_text', NEW.is_text,
          'is_code', NEW.is_code,
          'is_link', NEW.is_link,
          'is_video', NEW.is_video,
          'has_emoji', NEW.has_emoji,
          'has_masked_words', NEW.has_masked_words,
          'is_pinned', NEW.is_pinned,
          'is_favorite', NEW.is_favorite,
          'links', NEW.links,
          'detected_language', NEW.detected_language,
          'pinned_order_number', NEW.pinned_order_number,
          'created_at', NEW.created_at,
          'updated_at', NEW.updated_at,
          'history_options', NEW.history_options,
          'copied_from_app', NEW.copied_from_app
        ),
        get_hlc_wall_ms()
    );
END;

CREATE TRIGGER trg_clipboard_history_sync_update
AFTER UPDATE ON clipboard_history
WHEN sync_triggers_disabled() = 0 AND COALESCE(NEW.is_image, 0) = 0
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
        'clipboard_history',
        NEW.history_id,
        'update',
        get_hlc_wall_ms(),
        get_hlc_counter(),
        NEW.updated_at,
        json_object(
          'history_id', NEW.history_id,
          'title', NEW.title,
          'value', NEW.value,
          'value_preview', NEW.value_preview,
          'value_more_preview_lines', NEW.value_more_preview_lines,
          'value_more_preview_chars', NEW.value_more_preview_chars,
          'value_hash', NEW.value_hash,
          'is_image', NEW.is_image,
          'is_masked', NEW.is_masked,
          'is_text', NEW.is_text,
          'is_code', NEW.is_code,
          'is_link', NEW.is_link,
          'is_video', NEW.is_video,
          'has_emoji', NEW.has_emoji,
          'has_masked_words', NEW.has_masked_words,
          'is_pinned', NEW.is_pinned,
          'is_favorite', NEW.is_favorite,
          'links', NEW.links,
          'detected_language', NEW.detected_language,
          'pinned_order_number', NEW.pinned_order_number,
          'created_at', NEW.created_at,
          'updated_at', NEW.updated_at,
          'history_options', NEW.history_options,
          'copied_from_app', NEW.copied_from_app
        ),
        get_hlc_wall_ms()
    );
END;

CREATE TRIGGER trg_clipboard_history_sync_delete
AFTER DELETE ON clipboard_history
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
        'clipboard_history',
        OLD.history_id,
        'delete',
        get_hlc_wall_ms(),
        get_hlc_counter(),
        OLD.updated_at,
        NULL,
        get_hlc_wall_ms()
    );
END;
