#![cfg(target_os = "macos")]

use crate::SingleInstanceCallback;
use tauri::{
    plugin::{self, TauriPlugin},
    Manager, Runtime,
};
pub fn init<R: Runtime>(f: Box<SingleInstanceCallback<R>>) -> TauriPlugin<R> {
    plugin::Builder::new("single-instance")
        .setup(move |app| {
            let app_handle = app.handle();
            f(app_handle);
            Ok(())
        })
        .build()
}

pub fn destroy<R: Runtime, M: Manager<R>>(_manager: &M) {}
