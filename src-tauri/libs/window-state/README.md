![plugin-window-state](banner.png)

Save window positions and sizes and restore them when the app is reopened.

## Install

_This plugin requires a Rust version of at least **1.64**_

There are three general methods of installation that we can recommend.

1. Use crates.io and npm (easiest, and requires you to trust that our publishing pipeline worked)
2. Pull sources directly from Github using git tags / revision hashes (most secure)
3. Git submodule install this repo in your tauri project and then use file protocol to ingest the source (most secure, but inconvenient to use)

Install the Core plugin by adding the following to your `Cargo.toml` file:

`src-tauri/Cargo.toml`

```toml
[dependencies]
tauri-plugin-window-state = { git = "https://github.com/tauri-apps/plugins-workspace", branch = "dev" }
```

You can install the JavaScript Guest bindings using your preferred JavaScript package manager:

> Note: Since most JavaScript package managers are unable to install packages from git monorepos we provide read-only mirrors of each plugin. This makes installation option 2 more ergonomic to use.

```sh
pnpm add https://github.com/tauri-apps/tauri-plugin-window-state
# or
npm add https://github.com/tauri-apps/tauri-plugin-window-state
# or
yarn add https://github.com/tauri-apps/tauri-plugin-window-state
```

## Usage

First you need to register the core plugin with Tauri:

`src-tauri/src/main.rs`

```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Afterwards all windows will remember their state when the app is being closed and will restore to their previous state on the next launch.

Optionally you can also tell the plugin to save the state of all open window to disk by using the `save_window_state()` method exposed by the `AppHandleExt` trait:

```rust
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

// `tauri::AppHandle` now has the following additional method
app.save_window_state(StateFlags::all()); // will save the state of all open windows to disk
```

or through Javascript

```javascript
import { saveWindowState, StateFlags } from "tauri-plugin-window-state-api";

saveWindowState(StateFlags.ALL);
```

To manually restore a windows state from disk you can call the `restore_state()` method exposed by the `WindowExt` trait:

```rust
use tauri_plugin_window_state::{WindowExt, StateFlags};

// all `Window` types now have the following additional method
window.restore_state(StateFlags::all()); // will restore the windows state from disk
```

or through Javascript

```javascript
import { restoreStateCurrent, StateFlags } from "tauri-plugin-window-state-api";

restoreStateCurrent(StateFlags.ALL);
```

## Contributing

PRs accepted. Please make sure to read the Contributing Guide before making a pull request.

## License

Code: (c) 2015 - Present - The Tauri Programme within The Commons Conservancy.

MIT or MIT/Apache 2.0 where applicable.
