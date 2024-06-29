-- Rollback for link_metadata table
CREATE TEMPORARY TABLE link_metadata_backup(
    metadata_id VARCHAR(50) PRIMARY KEY,
    history_id VARCHAR(50) UNIQUE,
    item_id VARCHAR(50) UNIQUE,
    link_url VARCHAR(255),
    link_title VARCHAR(255),
    link_description TEXT,
    link_image VARCHAR(255),
    link_domain VARCHAR(255),
    link_favicon TEXT
);

INSERT INTO link_metadata_backup SELECT 
    metadata_id, history_id, item_id, link_url, link_title, 
    link_description, link_image, link_domain, link_favicon 
FROM link_metadata;

DROP TABLE link_metadata;

ALTER TABLE link_metadata_backup RENAME TO link_metadata;

-- Rollback for items table
CREATE TEMPORARY TABLE items_backup(
    item_id VARCHAR(50) PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    value VARCHAR(255),
    color VARCHAR(50),
    border_width INT DEFAULT 0,
    is_image BOOLEAN DEFAULT FALSE,
    image_path_full_res VARCHAR(255),
    image_preview_height INT DEFAULT 0,
    image_height INT DEFAULT 0,
    image_width INT DEFAULT 0,
    image_data_url VARCHAR(255),
    image_type VARCHAR(255),
    image_hash VARCHAR(255),
    image_scale INT DEFAULT 1,
    is_image_data BOOLEAN DEFAULT FALSE,
    is_masked BOOLEAN DEFAULT FALSE,
    is_text BOOLEAN DEFAULT FALSE,
    is_form BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    is_code BOOLEAN DEFAULT FALSE,
    is_link BOOLEAN DEFAULT FALSE,
    is_path BOOLEAN DEFAULT FALSE,
    is_file BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_protected BOOLEAN DEFAULT FALSE,
    is_command BOOLEAN DEFAULT FALSE,
    is_web_request BOOLEAN DEFAULT FALSE,
    is_web_scraping BOOLEAN DEFAULT FALSE,
    is_video BOOLEAN DEFAULT FALSE,
    has_emoji BOOLEAN DEFAULT FALSE,
    has_masked_words BOOLEAN DEFAULT FALSE,
    path_type VARCHAR(20),
    icon VARCHAR(20),
    icon_visibility VARCHAR(20),
    command_request_output TEXT,
    command_request_last_run_at BIGINT,
    request_options TEXT,
    form_template_options TEXT,
    links TEXT,
    detected_language VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    is_folder BOOLEAN NOT NULL DEFAULT FALSE,
    is_separator BOOLEAN NOT NULL DEFAULT FALSE,
    is_board BOOLEAN NOT NULL DEFAULT FALSE,
    is_menu BOOLEAN NOT NULL DEFAULT FALSE,
    is_clip BOOLEAN NOT NULL DEFAULT FALSE,
    size VARCHAR(10),
    layout VARCHAR(10),
    layout_items_max_width VARCHAR(10),
    layout_split INT NOT NULL DEFAULT 1,
    show_description BOOLEAN DEFAULT TRUE,
    pinned_order_number INT DEFAULT 0,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    created_date TIMESTAMP NOT NULL,
    updated_date TIMESTAMP NOT NULL
);

INSERT INTO items_backup SELECT 
    item_id, name, description, value, color, border_width, is_image, 
    image_path_full_res, image_preview_height, image_height, image_width, 
    image_data_url, image_type, image_hash, image_scale, is_image_data, 
    is_masked, is_text, is_form, is_template, is_code, is_link, is_path, 
    is_file, is_pinned, is_favorite, is_protected, is_command, 
    is_web_request, is_web_scraping, is_video, has_emoji, has_masked_words, 
    path_type, icon, icon_visibility, command_request_output, 
    command_request_last_run_at, request_options, form_template_options, 
    links, detected_language, is_active, is_disabled, is_deleted, 
    is_folder, is_separator, is_board, is_menu, is_clip, size, layout, 
    layout_items_max_width, layout_split, show_description, 
    pinned_order_number, created_at, updated_at, created_date, updated_date
FROM items;

DROP TABLE items;
ALTER TABLE items_backup RENAME TO items;