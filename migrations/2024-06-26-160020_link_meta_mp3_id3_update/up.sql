-- Adding new columns to link_metadata table
ALTER TABLE link_metadata ADD COLUMN link_track_artist VARCHAR(255);
ALTER TABLE link_metadata ADD COLUMN link_track_title VARCHAR(255);
ALTER TABLE link_metadata ADD COLUMN link_track_album VARCHAR(255);
ALTER TABLE link_metadata ADD COLUMN link_track_year VARCHAR(4);
ALTER TABLE link_metadata ADD COLUMN link_is_track BOOLEAN DEFAULT FALSE;

-- Adding new column to items table
ALTER TABLE items ADD COLUMN item_options TEXT;