-- Collections Table
CREATE TABLE collections (
    collection_id VARCHAR(50) PRIMARY KEY NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_selected BOOLEAN NOT NULL DEFAULT FALSE,

    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    created_date TIMESTAMP NOT NULL,
    updated_date TIMESTAMP NOT NULL
);

-- Items Table
CREATE TABLE items (
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

-- Tabs Board Table
CREATE TABLE tabs (
    tab_id VARCHAR(50) PRIMARY KEY NOT NULL,
    collection_id VARCHAR(50) NOT NULL,
    tab_name VARCHAR(255) NOT NULL,
    tab_is_active BOOLEAN NOT NULL DEFAULT TRUE,
    tab_is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    tab_order_number INT NOT NULL DEFAULT 0,
    tab_color VARCHAR(50),
    tab_layout VARCHAR(10),
    tab_layout_split INT NOT NULL DEFAULT 2,
    tab_is_protected BOOLEAN NOT NULL DEFAULT FALSE,

    FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE CASCADE
);

-- Collection Menu Items Table
CREATE TABLE collection_menu (
    collection_id VARCHAR(50) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    parent_id VARCHAR(50),
    order_number INT NOT NULL DEFAULT 0,

    FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES items(item_id) ON DELETE SET NULL,
    
    PRIMARY KEY (collection_id, item_id)
);

-- Collection Clips Table
CREATE TABLE collection_clips (
    collection_id VARCHAR(50) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    tab_id VARCHAR(50) NOT NULL,
    parent_id VARCHAR(50),
    order_number INT NOT NULL DEFAULT 0,

    FOREIGN KEY (collection_id) REFERENCES collections(collection_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
    FOREIGN KEY (tab_id) REFERENCES tabs(tab_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES items(item_id) ON DELETE SET NULL,
    
    PRIMARY KEY (collection_id, item_id, tab_id)
);

-- Clipboard History Table
CREATE TABLE clipboard_history (
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
    updated_date TIMESTAMP NOT NULL
);

-- Settings Table
CREATE TABLE settings (
    name TEXT PRIMARY KEY NOT NULL UNIQUE,
    value_text TEXT,
    value_bool BOOLEAN,
    value_int INTEGER
);

-- Link Metadata Table
CREATE TABLE link_metadata (
    metadata_id VARCHAR(50) PRIMARY KEY NOT NULL,
    history_id VARCHAR(50) UNIQUE,
    item_id VARCHAR(50) UNIQUE,
    link_url VARCHAR(255),
    link_title VARCHAR(255),
    link_description TEXT,
    link_image VARCHAR(255),
    link_domain VARCHAR(255),
    link_favicon TEXT,

    FOREIGN KEY (history_id) REFERENCES clipboard_history(history_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE
);

-- Indices
CREATE INDEX idx_image_hash ON clipboard_history(image_hash);
CREATE INDEX idx_value_hash ON clipboard_history(value_hash);
