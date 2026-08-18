use tauri::{plugin::TauriPlugin, AppHandle, Manager, Runtime};

#[cfg(target_os = "windows")]
#[path = "platform_impl/windows.rs"]
mod platform_impl;
#[cfg(target_os = "linux")]
#[path = "platform_impl/linux.rs"]
mod platform_impl;
#[cfg(target_os = "macos")]
#[path = "platform_impl/macos.rs"]
mod platform_impl;

pub(crate) type SingleInstanceCallback<R> =
    dyn FnMut(&AppHandle<R>, Vec<String>, String) + Send + Sync + 'static;

pub fn init<R: Runtime, F: FnMut(&AppHandle<R>, Vec<String>, String) + Send + Sync + 'static>(
    f: F,
) -> TauriPlugin<R> {
    platform_impl::init(Box::new(f))
}

pub fn destroy<R: Runtime, M: Manager<R>>(manager: &M) {
    platform_impl::destroy(manager)
}
