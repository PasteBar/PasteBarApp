-- Creating a temporary table without the new columns for link_metadata
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

-- Inserting data from the original table to the temporary table
INSERT INTO link_metadata_backup SELECT metadata_id, history_id, item_id, link_url, link_title, link_description, link_image, link_domain, link_favicon FROM link_metadata;

-- Dropping the original table
DROP TABLE link_metadata;

-- Renaming the backup table to the original name
ALTER TABLE link_metadata_backup RENAME TO link_metadata;

-- Handling the items table similarly
CREATE TEMPORARY TABLE items_backup AS SELECT * FROM items;
ALTER TABLE items_backup DROP COLUMN item_options;
DROP TABLE items;
ALTER TABLE items_backup RENAME TO items;
