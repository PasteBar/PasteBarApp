#![cfg(target_os = "linux")]

use std::sync::Arc;

use crate::SingleInstanceCallback;
use tauri::{
    plugin::{self, TauriPlugin},
    AppHandle, Config, Manager, RunEvent, Runtime,
};
use zbus::{
    blocking::{Connection, ConnectionBuilder},
    dbus_interface,
};

struct ConnectionHandle(Connection);

struct SingleInstanceDBus<R: Runtime> {
    callback: Box<SingleInstanceCallback<R>>,
    app_handle: AppHandle<R>,
}

#[dbus_interface(name = "org.SingleInstance.DBus")]
impl<R: Runtime> SingleInstanceDBus<R> {
    fn execute_callback(&mut self, argv: Vec<String>, cwd: String) {
        (self.callback)(&self.app_handle, argv, cwd);
    }
}

fn dbus_id(config: Arc<Config>) -> String {
    config
        .tauri
        .bundle
        .identifier
        .replace('.', "_")
        .replace('-', "_")
}

pub fn init<R: Runtime>(f: Box<SingleInstanceCallback<R>>) -> TauriPlugin<R> {
    plugin::Builder::new("single-instance")
        .setup(|app| {
            let id = dbus_id(app.config());
            let single_instance_dbus = SingleInstanceDBus {
                callback: f,
                app_handle: app.clone(),
            };
            let dbus_name = format!("org.{}.SingleInstance", id);
            let dbus_path = format!("/org/{}/SingleInstance", id);

            match ConnectionBuilder::session()
                .unwrap()
                .name(dbus_name.as_str())
                .unwrap()
                .serve_at(dbus_path.as_str(), single_instance_dbus)
                .unwrap()
                .build()
            {
                Ok(connection) => {
                    app.manage(ConnectionHandle(connection));
                }
                Err(zbus::Error::NameTaken) => {
                    if let Ok(connection) = Connection::session() {
                        let _ = connection.call_method(
                            Some(dbus_name.as_str()),
                            dbus_path.as_str(),
                            Some("org.SingleInstance.DBus"),
                            "ExecuteCallback",
                            &(
                                std::env::args().collect::<Vec<String>>(),
                                std::env::current_dir()
                                    .unwrap_or_default()
                                    .to_str()
                                    .unwrap_or_default(),
                            ),
                        );
                    }
                    std::process::exit(0)
                }
                _ => {}
            }

            Ok(())
        })
        .on_event(|app, event| {
            if let RunEvent::Exit = event {
                destroy(app);
            }
        })
        .build()
}

pub fn destroy<R: Runtime, M: Manager<R>>(manager: &M) {
    if let Some(connection) = manager.try_state::<ConnectionHandle>() {
        let dbus_name = format!("org.{}.SingleInstance", dbus_id(manager.config()));
        let _ = connection.0.release_name(dbus_name);
    }
}
