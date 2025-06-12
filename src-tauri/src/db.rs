use lazy_static::lazy_static;
use once_cell::sync::OnceCell;
use serde::Serialize;
use std::fs;
use std::path::Path;
use std::path::PathBuf;
use std::sync::RwLock;
use std::time::Duration;

use diesel::connection::SimpleConnection;
use diesel::prelude::*;
use diesel::r2d2 as diesel_r2d2;

use crate::services::user_settings_service::load_user_config;
use diesel::sqlite::SqliteConnection;

// use diesel::connection::{set_default_instrumentation, Instrumentation, InstrumentationEvent};

use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

use crate::services::utils::debug_output;

const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

type Pool = r2d2::Pool<diesel_r2d2::ConnectionManager<SqliteConnection>>;

#[derive(Serialize)]
pub struct AppConstants<'a> {
  pub app_data_dir: std::path::PathBuf,
  pub app_dev_data_dir: std::path::PathBuf,
  pub app_detect_languages_supported: [&'a str; 23],
}
pub static APP_CONSTANTS: OnceCell<AppConstants> = OnceCell::new();

#[derive(Debug)]
pub struct ConnectionOptions {
  pub enable_wal: bool,
  pub enable_foreign_keys: bool,
  pub busy_timeout: Option<Duration>,
}

lazy_static! {
  pub static ref DB_POOL_CONNECTION: RwLock<Pool> = RwLock::new(init_connection_pool());
}

impl diesel::r2d2::CustomizeConnection<SqliteConnection, diesel::r2d2::Error>
  for ConnectionOptions
{
  fn on_acquire(&self, conn: &mut SqliteConnection) -> Result<(), diesel::r2d2::Error> {
    (|| {
      if self.enable_wal {
        conn.batch_execute("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;")?;
      }
      if self.enable_foreign_keys {
        conn.batch_execute("PRAGMA foreign_keys = ON;")?;
      }
      if let Some(d) = self.busy_timeout {
        conn.batch_execute(&format!("PRAGMA busy_timeout = {};", d.as_millis()))?;
      }
      Ok(())
    })()
    .map_err(diesel::r2d2::Error::QueryError)
  }
}

pub fn adjust_canonicalization<P: AsRef<Path>>(p: P) -> String {
  const VERBATIM_PREFIX: &str = r#"\\?\"#;
  let p = p.as_ref().display().to_string();
  if p.starts_with(VERBATIM_PREFIX) {
    p[VERBATIM_PREFIX.len()..].to_string()
  } else {
    p
  }
}

fn init_connection_pool() -> Pool {
  // debug only with simple sql logger set_default_instrumentation suports only on diesel master
  // diesel::connection::set_default_instrumentation(simple_sql_logger);
  let db_path = get_db_path();

  debug_output(|| {
    println!("Init pool database connection to: {}", db_path);
  });

  let manager = diesel_r2d2::ConnectionManager::<SqliteConnection>::new(db_path);
  r2d2::Pool::builder()
    .connection_customizer(Box::new(ConnectionOptions {
      enable_wal: false,
      enable_foreign_keys: false,
      busy_timeout: Some(Duration::from_secs(3)),
    }))
    .build(manager)
    .expect("Failed to create db pool.")
}

pub fn reinitialize_connection_pool() {
  let new_pool = init_connection_pool();
  let mut pool_lock = DB_POOL_CONNECTION.write().unwrap();
  *pool_lock = new_pool;
}

pub fn init(app: &mut tauri::App) {
  let config = app.config().clone();

  let resource_path = app.path_resolver().resource_dir().unwrap();

  #[cfg(debug_assertions)]
  let local_dev_path = resource_path
    .parent()
    .unwrap()
    .parent()
    .unwrap()
    .parent()
    .unwrap();

  if cfg!(debug_assertions) {
    println!(
      "Appdata path is {}",
      tauri::api::path::app_data_dir(&config)
        .expect("failed to retrieve app_data_dir")
        .display()
    );

    #[cfg(debug_assertions)]
    println!("Local App dev path is {}", &local_dev_path.display());
  }

  ensure_dir_exists(&tauri::api::path::app_data_dir(&config).unwrap()); // canonicalize will work only if path exists

  let _ = APP_CONSTANTS.set(AppConstants {
    #[cfg(not(debug_assertions))]
    app_dev_data_dir: std::path::PathBuf::from(resource_path),
    #[cfg(debug_assertions)]
    app_dev_data_dir: std::path::PathBuf::from(local_dev_path),
    app_data_dir: tauri::api::path::app_data_dir(&config)
      .expect("failed to retrieve app_data_dir")
      .canonicalize()
      .expect("Failed to canonicalize app_data_dir"),
    app_detect_languages_supported: [
      "c",
      "cpp",
      "csharp",
      "css",
      "docker",
      "dart",
      "go",
      "html",
      "java",
      "javascript",
      "jsx",
      "json",
      "kotlin",
      "markdown",
      "php",
      "python",
      "regxp",
      "ruby",
      "rust",
      "shell",
      "sql",
      "swift",
      "yaml",
    ],
  });

  if !db_file_exists() {
    create_db_file();
  }

  run_migrations();
}

pub fn ensure_dir_exists(path: &PathBuf) {
  if let Err(e) = fs::create_dir_all(path) {
    debug_output(|| {
      eprintln!("Failed to create directory: {}", e);
    });
  } else {
    debug_output(|| {
      println!("Directory created successfully {}", path.display());
    });
  }
}

pub fn establish_pool_db_connection(
) -> diesel_r2d2::PooledConnection<diesel_r2d2::ConnectionManager<SqliteConnection>> {
  debug_output(|| {
    println!("Connecting to db pool");
  });

  DB_POOL_CONNECTION
    .read()
    .unwrap()
    .get()
    .unwrap_or_else(|_| panic!("Error connecting to db pool"))
}

pub fn _establish_direct_db_connection() -> SqliteConnection {
  let db_path = get_db_path().clone();
  println!("Connecting to database at: {}", db_path);

  let connection = SqliteConnection::establish(&db_path)
    .unwrap_or_else(|_| panic!("Error connecting to {}", db_path));

  connection
}

fn run_migrations() {
  let mut connection = establish_pool_db_connection();
  connection.run_pending_migrations(MIGRATIONS).unwrap();
}

fn create_db_file() {
  let db_path = get_db_path();
  let db_dir = Path::new(&db_path).parent().unwrap();

  if !db_dir.exists() {
    fs::create_dir_all(db_dir).unwrap();
  }

  fs::File::create(db_path).unwrap();
}

fn db_file_exists() -> bool {
  let db_path = get_db_path();
  Path::new(&db_path).exists()
}

/// Returns the base directory for application data.
/// This will be a `pastebar-data` subdirectory if a custom path is set.
pub fn get_data_dir() -> PathBuf {
  let user_config = load_user_config();
  if let Some(custom_path_str) = user_config.custom_db_path {
    PathBuf::from(custom_path_str)
  } else {
    get_default_data_dir()
  }
}

/// Returns the default application data directory.
pub fn get_default_data_dir() -> PathBuf {
  if cfg!(debug_assertions) {
    APP_CONSTANTS.get().unwrap().app_dev_data_dir.clone()
  } else {
    APP_CONSTANTS.get().unwrap().app_data_dir.clone()
  }
}

pub fn get_db_path() -> String {
  let filename = if cfg!(debug_assertions) {
    "local.pastebar-db.data"
  } else {
    "pastebar-db.data"
  };

  let db_path = get_data_dir().join(filename);
  db_path.to_string_lossy().into_owned()
}

/// Returns the path to the `clip-images` directory.
pub fn get_clip_images_dir() -> PathBuf {
  get_data_dir().join("clip-images")
}

/// Returns the path to the `clipboard-images` directory.
pub fn get_clipboard_images_dir() -> PathBuf {
  get_data_dir().join("clipboard-images")
}

/// Returns the default database file path as a string.
pub fn get_default_db_path_string() -> String {
  let db_path = get_default_data_dir().join("pastebar-db.data");
  db_path.to_string_lossy().into_owned()
}

/// Converts an absolute image path to a relative path with {{base_folder}} placeholder
pub fn to_relative_image_path(absolute_path: &str) -> String {
  let data_dir = get_data_dir();
  let data_dir_str = data_dir.to_string_lossy();

  if absolute_path.starts_with(&data_dir_str.as_ref()) {
    // Remove the data directory prefix and replace with placeholder
    let relative_path = absolute_path
      .strip_prefix(&data_dir_str.as_ref())
      .unwrap_or(absolute_path)
      .trim_start_matches('/')
      .trim_start_matches('\\');
    format!("{{{{base_folder}}}}/{}", relative_path)
  } else {
    // If path doesn't start with data dir, return as is
    absolute_path.to_string()
  }
}

/// Converts a relative image path with {{base_folder}} placeholder to absolute path
pub fn to_absolute_image_path(relative_path: &str) -> String {
  if relative_path.starts_with("{{base_folder}}") {
    let data_dir = get_data_dir();
    let path_without_placeholder = relative_path
      .strip_prefix("{{base_folder}}")
      .unwrap_or(relative_path)
      .trim_start_matches('/')
      .trim_start_matches('\\');
    data_dir
      .join(path_without_placeholder)
      .to_string_lossy()
      .into_owned()
  } else {
    // If path doesn't have placeholder, return as is
    relative_path.to_string()
  }
}

fn can_access_or_create(db_path: &str) -> bool {
  let path = std::path::Path::new(db_path);

  if let Some(parent) = path.parent() {
    if let Err(e) = std::fs::create_dir_all(parent) {
      eprintln!(
        "Failed to create parent directory '{}': {}",
        parent.display(),
        e
      );
      return false;
    }
  }

  match std::fs::OpenOptions::new()
    .read(true)
    .write(true)
    .create(true)
    .open(&path)
  {
    Ok(_file) => true,
    Err(e) => {
      eprintln!("Failed to open custom DB path '{}': {}", db_path, e);
      false
    }
  }
}

pub fn get_config_file_path() -> PathBuf {
  if cfg!(debug_assertions) {
    let app_dir = APP_CONSTANTS
      .get()
      .expect("APP_CONSTANTS not initialized")
      .app_dev_data_dir
      .clone();
    if cfg!(target_os = "macos") {
      PathBuf::from(format!(
        "{}/pastebar_settings.yaml",
        adjust_canonicalization(app_dir)
      ))
    } else if cfg!(target_os = "windows") {
      PathBuf::from(format!(
        "{}\\pastebar_settings.yaml",
        adjust_canonicalization(app_dir)
      ))
    } else {
      PathBuf::from(format!(
        "{}/pastebar_settings.yaml",
        adjust_canonicalization(app_dir)
      ))
    }
  } else {
    // Release mode
    let app_data_dir = APP_CONSTANTS.get().unwrap().app_data_dir.clone();
    let data_dir = app_data_dir.as_path();

    if cfg!(target_os = "macos") {
      PathBuf::from(format!(
        "{}/pastebar_settings.yaml",
        adjust_canonicalization(data_dir)
      ))
    } else if cfg!(target_os = "windows") {
      PathBuf::from(format!(
        "{}\\pastebar_settings.yaml",
        adjust_canonicalization(data_dir)
      ))
    } else {
      PathBuf::from(format!(
        "{}/pastebar_settings.yaml",
        adjust_canonicalization(data_dir)
      ))
    }
  }
}

// fn simple_sql_logger() -> Option<Box<dyn Instrumentation>> {
//   Some(Box::new(
//     move |event: InstrumentationEvent<'_>| match event {
//       InstrumentationEvent::StartQuery { query, .. } => {
//         println!("Executing query: {}", query);
//       }
//       InstrumentationEvent::FinishQuery { query, error, .. } => match error {
//         Some(e) => println!("Query: {} finished with error: {:?}", query, e),
//         None => println!("Query executed successfully: {}", query),
//       },
//       _ => (), // Optionally handle other events
//     },
//   ))
// }
