## Backup and Restore Feature Implementation Plan

Based on my analysis of the PasteBar codebase, here's a comprehensive plan to implement the Backup and Restore functionality:

### 1. **Frontend Implementation**

#### A. Add Navigation Entry (in AppSettings.tsx)
- Add a new NavLink for "Backup and Restore" between User Preferences and Security sections
- Route path: `/app-settings/backup-restore`

#### B. Create BackupRestoreSettings.tsx Component
The component will include:
- **Backup Section:**
  - Checkbox options: "Include images" (checked by default)
  - "Backup Now" button
  - Progress indicator during backup
  - **Confirmation dialog before backup:** "Create a backup of your data?"
  - After backup: Dialog to move file or keep in current location
  
- **Restore Section:**
  - **"Restore from File" button** - Opens file picker to select backup from any location
  - List of existing backup files (parsed from filesystem)
  - Display: backup filename, date/time, file size
  - **Total backup space indicator** at the top of the list
  - "Restore" button for each backup
  - **"Delete" button for each backup** (trash icon)
  - **Confirmation dialog before restore:** "This will replace all current data. Are you sure?"
  - **Confirmation dialog before delete:** "Delete this backup? This action cannot be undone."

#### C. Update Router Configuration (pages/index.tsx)
- Add route: `{ path: 'backup-restore', element: <BackupRestoreSettings /> }`

### 2. **Backend Implementation (Rust/Tauri)**

#### A. Create Backup/Restore Commands Module
`src-tauri/src/commands/backup_restore_commands.rs`:

- `create_backup(include_images: bool)` - Creates zip file with:
  - Database file (pastebar-db.data)
  - clip-images/ folder (if include_images is true)
  - history-images/ folder (if include_images is true)
  - Returns: backup file path

- `list_backups()` - Lists all backup files in data directory
  - Returns: Vec<BackupInfo> with filename, date, size
  - **Calculates total size of all backups**

- `restore_backup(backup_path: String)` - Restores from backup:
  - Validates zip file (works with both local and external paths)
  - Creates temporary backup of current data
  - Extracts and replaces database and image folders
  - Returns: success/error status

- `select_backup_file()` - Opens native file picker
  - Filters for .zip files
  - Returns selected file path
  - Validates that it's a valid PasteBar backup

- `delete_backup(backup_path: String)` - Deletes a backup file
  - Validates file exists and is a backup
  - Deletes the file
  - Returns: success/error status

- `get_data_paths()` - Gets current database and image folder paths
  - Checks for custom data location setting
  - Returns default or custom paths

#### B. Update main.rs
- Register new commands in the Tauri builder

### 3. **File Structure and Naming**

- Backup filename format: `pastebar-data-backup-YYYY-MM-DD-HH-mm.zip`
- Default location: Same as database location (custom or default)
- Zip structure:
  ```
  pastebar-data-backup-2024-01-06-14-30.zip
  ├── pastebar-db.data
  ├── clip-images/
  │   └── [image files]
  └── history-images/
      └── [image files]
  ```

### 4. **UI/UX Flow**

1. **Creating a Backup:**
   - User navigates to Settings → Backup and Restore
   - Selects backup options (include images or not)
   - Clicks "Backup Now"
   - **Confirmation dialog:** "Create a backup of your data?"
   - Progress indicator shows during compression
   - Dialog appears: "Backup created successfully. Move to another location?"
   - Options: "Move...", "Keep in current location"

2. **Restoring from List:**
   - User sees list of available backups with total space used
   - Clicks "Restore" on desired backup
   - **Confirmation dialog:** "This will replace all current data. Are you sure?"
   - Progress indicator during restore
   - App automatically restarts after successful restore

3. **Restoring from External File:**
   - User clicks "Restore from File" button
   - Native file picker opens (filtered for .zip files)
   - User selects backup file from any location (external drive, cloud folder, etc.)
   - File is validated as a PasteBar backup
   - **Confirmation dialog:** "Restore from {{filename}}? This will replace all current data."
   - Progress indicator during restore
   - App automatically restarts after successful restore

4. **Deleting a Backup:**
   - User clicks delete (trash) icon on a backup
   - **Confirmation dialog:** "Delete this backup? This action cannot be undone."
   - Backup is deleted and list refreshes
   - Total backup space updates

### 5. **UI Layout**

```
Backup and Restore
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create Backup
─────────────
☑ Include images in backup
[Backup Now]

Restore Data
────────────
[Restore from File...]  ← Opens file picker

Available Backups (Total: 152.3 MB)
───────────────────────────────────
📦 pastebar-data-backup-2024-01-06-14-30.zip
   Created: January 6, 2024 at 2:30 PM
   Size: 25.4 MB
   [Restore] [🗑️]

📦 pastebar-data-backup-2024-01-05-09-15.zip
   Created: January 5, 2024 at 9:15 AM
   Size: 23.1 MB
   [Restore] [🗑️]
```

### 6. **Translations to Add**

Settings page titles and descriptions:
- "Backup and Restore"
- "Create Backup"
- "Include images in backup"
- "Backup Now"
- "Restore Data"
- "Restore from File..."
- "Select backup file"
- "Available Backups"
- "Total backup space: {{size}}"
- "No backups found"
- "Restore"
- "Delete"
- "Create a backup of your data?"
- "Backup created successfully"
- "Move to another location?"
- "This will replace all current data. Are you sure?"
- "Restore from {{filename}}? This will replace all current data."
- "Delete this backup? This action cannot be undone."
- "Restore completed. The application will restart."
- "Creating backup..."
- "Restoring backup..."
- "Backup deleted successfully"
- "Failed to delete backup"
- "Invalid backup file"
- "The selected file is not a valid PasteBar backup"

### 7. **Error Handling**

- Handle insufficient disk space
- Validate zip file integrity before restore
- Verify backup contains expected files (pastebar-db.data)
- Create automatic backup before restore operation
- Handle file permission errors
- Rollback on restore failure
- Prevent deletion of backup that's currently being restored
- Handle corrupted or incomplete backup files
- Validate external backup files are from PasteBar

### 8. **Implementation Order**

1. Create backend commands and file operations
2. Add frontend navigation and basic UI
3. Implement backup creation flow with confirmation
4. Implement backup listing with total space calculation
5. Implement restore from list functionality with confirmation
6. Implement "Restore from File" with file picker
7. Implement delete functionality with confirmation
8. Add all confirmation dialogs
9. Add translations for all languages
10. Test complete workflow including external file restore

This implementation provides maximum flexibility for users to manage their backups, whether stored locally or on external drives/cloud storage, while maintaining data safety through multiple confirmation dialogs and validation checks.