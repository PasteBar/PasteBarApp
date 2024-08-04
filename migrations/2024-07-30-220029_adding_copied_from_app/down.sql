-- down.sql
CREATE TABLE clipboard_history_new (
    history_id VARCHAR(50) PRIMARY KEY NOT NULL,
    title VARCHAR(255),
    value VARCHAR(255),
    value_preview VARCHAR(150),
    value_more_preview_lines INT DEFAULT 0,
    value_more_preview_chars INT DEFAULT 0,
    value_hash VARCHAR(255),
    is_image BOOLEAN DEFAULT FALSE,
    image_path_full_res VARCHAR(255),
    image_data_low_res BLOB,
    image_preview_height INT DEFAULT 0,
    image_height INT DEFAULT 0,
    image_width INT DEFAULT 0,
    image_data_url VARCHAR(255),
    image_hash VARCHAR(255),
    is_image_data BOOLEAN DEFAULT FALSE,
    is_masked BOOLEAN DEFAULT FALSE,
    is_text BOOLEAN DEFAULT FALSE,
    is_code BOOLEAN DEFAULT FALSE,
    is_link BOOLEAN DEFAULT FALSE,
    is_video BOOLEAN DEFAULT FALSE,
    has_emoji BOOLEAN DEFAULT FALSE,
    has_masked_words BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    links TEXT,
    detected_language VARCHAR(20),
    pinned_order_number INT DEFAULT 0,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    created_date TIMESTAMP NOT NULL,
    updated_date TIMESTAMP NOT NULL,
    history_options TEXT
);

INSERT INTO clipboard_history_new SELECT
    history_id, title, value, value_preview, value_more_preview_lines,
    value_more_preview_chars, value_hash, is_image, image_path_full_res,
    image_data_low_res, image_preview_height, image_height, image_width,
    image_data_url, image_hash, is_image_data, is_masked, is_text, is_code,
    is_link, is_video, has_emoji, has_masked_words, is_pinned, is_favorite,
    links, detected_language, pinned_order_number, created_at, updated_at,
    created_date, updated_date, history_options
FROM clipboard_history;

DROP TABLE clipboard_history;
ALTER TABLE clipboard_history_new RENAME TO clipboard_history;