# Plan: Implement Custom Data Location Feature

This document outlines the plan to implement the feature allowing users to specify a custom location for the PasteBar application's data.

## 1. Goals

*   Allow users to specify a custom parent directory for application data via the settings UI.
*   The application will create and manage a `pastebar-data` subdirectory within the user-specified location.
*   This `pastebar-data` directory will contain the database file (`pastebar-db.data`), the `clip-images` folder, and the `clipboard-images` folder.
*   Provide options to either **move** the existing data, **copy** it, or **use the new location without moving/copying**.
*   Ensure the application uses the data from the new location after a restart.
*   Handle potential errors gracefully and inform the user.
*   Update the application state and backend configuration accordingly.

## 2. Backend (Rust - `src-tauri`)

### 2.1. Configuration (`user_settings_service.rs`)

*   The `UserConfig` struct's `custom_db_path: Option<String>` will now be repurposed to store the path to the **user-selected parent directory**. The application logic will handle appending the `/pastebar-data/` segment. This requires no change to the struct itself, only to how the path is interpreted.

### 2.2. Path Logic (`db.rs` and new helpers)

*   We will introduce new helper functions to consistently resolve data paths, whether default or custom.
    *   `get_data_dir() -> PathBuf`: This will be the core helper. It checks for a `custom_db_path` in the settings.
        *   If present, it returns `PathBuf::from(custom_path)`.
        *   If `None`, it returns the default application data directory.
    *   `get_db_path()`: This function will be refactored to use `get_data_dir().join("pastebar-db.data")`.
    *   `get_clip_images_dir()`: A new helper that returns `get_data_dir().join("clip-images")`.
    *   `get_clipboard_images_dir()`: A new helper that returns `get_data_dir().join("clipboard-images")`.

### 2.3. New & Updated Tauri Commands (`user_settings_command.rs`)

*   **`cmd_validate_custom_db_path(path: String) -> Result<bool, String>`**
    *   **No change in purpose.** This command will still check if the user-selected directory is valid and writable.
*   **`cmd_check_custom_data_path(path: String) -> Result<PathStatus, String>`**
    *   A new command to check the status of a selected directory. It returns one of the following statuses: `Empty`, `NotEmpty`, `IsPastebarDataAndNotEmpty`.
*   **`cmd_set_and_relocate_data(new_parent_dir_path: String, operation: String) -> Result<String, String>`** (renamed from `set_and_relocate_db`)
    *   `new_parent_dir_path`: The new directory path selected by the user.
    *   `operation`: Either "move", "copy", or "none".
    *   **Updated Steps:**
        1.  Get the source paths:
            *   Current DB file path.
            *   Current `clip-images` directory path.
            *   Current `clipboard-images` directory path.
        2.  Define the new data directory: `let new_data_dir = Path::new(&new_parent_dir_path);`
        3.  Create the new data directory: `fs::create_dir_all(&new_data_dir)`.
        4.  Perform file/directory operations for each item (DB file, `clip-images` dir, `clipboard-images` dir):
            *   If "move": `fs::rename(source, destination)`.
            *   If "copy": `fs::copy` for the file, and a recursive copy function for the directories.
            *   If "none", do nothing.
            *   Handle cases where source items might not exist (e.g., `clip-images` folder hasn't been created yet) by skipping them gracefully.
        5.  If successful, call `user_settings_service::set_custom_db_path(&new_parent_dir_path)`.
        6.  Return a success or error message.

*   **`cmd_revert_to_default_data_location() -> Result<String, String>`** (renamed and simplified)
    *   **Updated Steps:**
        1.  Call `user_settings_service::remove_custom_db_path()` to clear the custom data path setting.
        2.  Return a success message indicating the setting has been removed.

## 3. Frontend (React)

*   The UI has been updated to refer to "Custom Application Data Location" instead of "Custom Database Location".
*   A third radio button option, "Use new location", has been added.
*   The `handleBrowse` function now calls the `cmd_check_custom_data_path` command to analyze the selected directory and prompts the user accordingly.
*   The `settingsStore.ts` has been updated to support the "none" operation.

## 4. User Interaction Flow (Mermaid Diagram)

```mermaid
graph TD
    subgraph User Flow
        A[User navigates to User Preferences] --> B{Custom Data Path Set?};
        B -- Yes --> C[Display Current Custom Path];
        B -- No --> D[Display Current Path: Default];

        C --> E[Show "Revert to Default" Button];
        D --> F[User Selects New Parent Directory];
        F --> G{Path Status?};
        G -- Empty --> H[Set Path];
        G -- Not Empty --> I{Confirm "pastebar-data" subfolder};
        I -- Yes --> J[Append "pastebar-data" to path];
        J --> H;
        I -- No --> H;
        G -- Is 'pastebar-data' and Not Empty --> K[Alert user existing data will be used];
        K --> H;
        H --> L[User Selects Operation: Move/Copy/None];
        L --> M[User Clicks "Apply and Restart"];
    end

    subgraph Backend Logic
        M --> N[Frontend calls `cmd_set_and_relocate_data`];
        N -- Success --> O[1. Create new data dir if needed];
        O --> P[2. Move/Copy/Skip data];
        P --> Q[3. Update `custom_db_path` in settings];
        Q --> R[Show Success Toast & Relaunch App];
        N -- Error --> S[Show Error Toast];

        E --> T[User Clicks "Revert"];
        T --> U[Frontend calls `cmd_revert_to_default_data_location`];
        U -- Success --> V[Move/Copy data back to default app dir & clear setting];
        V --> W[Show Success Toast & Relaunch App];
        U -- Error --> X[Show Error Toast];
    end

    D -- "Browse..." --> F;
```

## 5. Implementation Summary

The following changes have been implemented:

*   **`packages/pastebar-app-ui/src/pages/settings/UserPreferences.tsx`**:
    *   Renamed "Custom Database Location" to "Custom Application Data Location".
    *   Added a third radio button for the "Use new location" option.
    *   Updated the `handleBrowse` function to call the new `cmd_check_custom_data_path` command and handle the different path statuses with user prompts.
*   **`packages/pastebar-app-ui/src/store/settingsStore.ts`**:
    *   Updated the `applyCustomDbPath` function to accept the "none" operation.
    *   Updated the `revertToDefaultDbPath` function to call the renamed backend command.
*   **`src-tauri/src/commands/user_settings_command.rs`**:
    *   Added the `cmd_check_custom_data_path` command.
    *   Renamed `cmd_set_and_relocate_db` to `cmd_set_and_relocate_data` and updated its logic to handle the "none" operation and the new data directory structure.
    *   Renamed `cmd_revert_to_default_db_location` to `cmd_revert_to_default_data_location` and updated its logic.
*   **`src-tauri/src/db.rs`**:
    *   Refactored the `get_data_dir` function to no longer automatically append `pastebar-data`.
    *   Added `get_clip_images_dir` and `get_clipboard_images_dir` helper functions.
*   **`src-tauri/src/main.rs`**:
    *   Registered the new and renamed commands in the `invoke_handler`.
*   **`src-tauri/Cargo.toml`**:
    *   Added the `fs_extra` dependency for recursive directory copying.
*   **`src-tauri/src/services/items_service.rs`** and **`src-tauri/src/services/history_service.rs`**:
    *   Updated to use the new `get_clip_images_dir` and `get_clipboard_images_dir` helper functions.
