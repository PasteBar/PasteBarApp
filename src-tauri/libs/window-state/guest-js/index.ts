import { invoke } from "@tauri-apps/api/tauri";
import { WindowLabel, getCurrent } from "@tauri-apps/api/window";

export enum StateFlags {
  SIZE = 1 << 0,
  POSITION = 1 << 1,
  MAXIMIZED = 1 << 2,
  VISIBLE = 1 << 3,
  DECORATIONS = 1 << 4,
  FULLSCREEN = 1 << 5,
  ALL = SIZE | POSITION | MAXIMIZED | VISIBLE | DECORATIONS | FULLSCREEN,
}

/**
 *  Save the state of all open windows to disk.
 */
async function saveWindowState(flags: StateFlags) {
  invoke("plugin:window-state|save_window_state", { flags });
}

/**
 *  Restore the state for the specified window from disk.
 */
async function restoreState(label: WindowLabel, flags: StateFlags) {
  invoke("plugin:window-state|restore_state", { label, flags });
}

/**
 *  Restore the state for the current window from disk.
 */
async function restoreStateCurrent(flags: StateFlags) {
  restoreState(getCurrent().label, flags);
}

export { restoreState, restoreStateCurrent, saveWindowState };
