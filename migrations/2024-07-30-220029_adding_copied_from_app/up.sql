
-- Adding new column to clipboard_history table
ALTER TABLE clipboard_history ADD COLUMN copied_from_app VARCHAR(255);
