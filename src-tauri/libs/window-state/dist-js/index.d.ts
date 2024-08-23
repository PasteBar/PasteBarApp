import { WindowLabel } from "@tauri-apps/api/window";
export declare enum StateFlags {
    SIZE = 1,
    POSITION = 2,
    MAXIMIZED = 4,
    VISIBLE = 8,
    DECORATIONS = 16,
    FULLSCREEN = 32,
    ALL = 63
}
/**
 *  Save the state of all open windows to disk.
 */
declare function saveWindowState(flags: StateFlags): Promise<void>;
/**
 *  Restore the state for the specified window from disk.
 */
declare function restoreState(label: WindowLabel, flags: StateFlags): Promise<void>;
/**
 *  Restore the state for the current window from disk.
 */
declare function restoreStateCurrent(flags: StateFlags): Promise<void>;
export { restoreState, restoreStateCurrent, saveWindowState };
