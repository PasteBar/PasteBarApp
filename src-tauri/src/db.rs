use once_cell::sync::OnceCell;
use serde::Serialize;
use std::sync::RwLock;
use std::fs;
use std::path::Path;
use std::path::PathBuf;
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

// Replaced lazy_static with RwLock for dynamic pool reinitialization
pub static DB_POOL_STATE: RwLock<Option<(String, Pool)>> = RwLock::new(None);

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

// Renamed and modified to take db_path as argument
fn do_init_connection_pool(db_path_for_pool: &str) -> Pool {
  debug_output(|| {
    println!("Initializing new connection pool for: {}", db_path_for_pool);
  });

  let manager = diesel_r2d2::ConnectionManager::<SqliteConnection>::new(db_path_for_pool);
  r2d2::Pool::builder()
    .connection_customizer(Box::new(ConnectionOptions {
      enable_wal: false, // Consider making these configurable or consistent
      enable_foreign_keys: false,
      busy_timeout: Some(Duration::from_secs(3)),
    }))
    .build(manager)
    .expect("Failed to create db pool.") // Consider returning Result in future
}

// New function to explicitly reinitialize (or initialize for the first time)
pub fn reinitialize_db_pool() -> Result<(), String> {
    let current_db_path = get_db_path();
    let mut write_guard = DB_POOL_STATE.write().map_err(|e| format!("Failed to acquire write lock on DB_POOL_STATE: {}", e))?;

    // If a pool exists and is for the current path, nothing to do.
    if let Some((pool_path, _)) = &*write_guard {
        if pool_path == &current_db_path {
            debug_output(|| println!("DB pool already initialized for path: {}", current_db_path));
            return Ok(());
        }
    }

    println!("Reinitializing DB pool for path: {}", current_db_path);
    let new_pool = do_init_connection_pool(&current_db_path);
    *write_guard = Some((current_db_path, new_pool));
    Ok(())
}

// New function to get a clone of the current pool
pub fn get_db_pool_cloned() -> Result<Pool, String> {
    let read_guard = DB_POOL_STATE.read().map_err(|e| format!("Failed to acquire read lock on DB_POOL_STATE: {}", e))?;

    if let Some((path, pool)) = &*read_guard {
        // Check if the path of the current pool is still the active db path.
        // This is a safeguard. `reinitialize_db_pool` should be the primary mechanism for updates.
        let current_db_path = get_db_path();
        if path == &current_db_path {
            debug_output(|| println!("Cloning existing DB pool for path: {}", path));
            return Ok(pool.clone());
        } else {
            // Path mismatch, means pool is stale. Needs reinitialization.
            // This situation should ideally be avoided by calling reinitialize_db_pool proactively.
            debug_output(|| println!("Pool path {} is stale (current is {}). Forcing reinitialization.", path, current_db_path));
            // Fall through to reinitialize logic by releasing read lock and proceeding.
        }
    }

    // Release the current read lock before attempting to acquire a write lock for reinitialization
    drop(read_guard);

    debug_output(|| println!("DB pool not initialized or stale. Attempting to reinitialize now."));
    reinitialize_db_pool()?; // Initialize or reinitialize it

    let read_guard_after_init = DB_POOL_STATE.read().map_err(|e| format!("Failed to acquire read lock after init: {}", e))?;
    if let Some((_, pool)) = &*read_guard_after_init {
        Ok(pool.clone())
    } else {
        // This should not happen if reinitialize_db_pool succeeded.
        Err("Failed to get DB pool even after reinitialization attempt.".to_string())
    }
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

  // Initialize the DB pool after constants are set and db file potentially created
  reinitialize_db_pool().expect("Failed to initialize DB pool at startup");

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
    println!("Establishing connection from DB pool.");
  });
  let pool = get_db_pool_cloned().unwrap_or_else(|e| panic!("Failed to get DB pool: {}", e));
  pool.get().unwrap_or_else(|e| panic!("Error getting connection from pool: {}", e))
}

pub fn _establish_direct_db_connection() -> SqliteConnection {
  let db_path = get_db_path().clone();
  println!("Connecting to database at: {}", db_path);

  let connection = SqliteConnection::establish(&db_path)
    .unwrap_or_else(|_| panic!("Error connecting to {}", db_path));

  connection
}

fn run_migrations() {
  // It's important that reinitialize_db_pool() is called before this if the path might have changed.
  // Or, ensure establish_pool_db_connection always provides a connection to the *correct* current DB.
  // With get_db_pool_cloned() attempting reinitialization if stale, this should be safer.
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

  // It's crucial that APP_CONSTANTS and user_config (for custom_db_path) are readable here.
  // get_data_dir() handles this.
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

  if absolute_path.starts_with(data_dir_str.as_ref()) {
    // Remove the data directory prefix and replace with placeholder
    let relative_path = absolute_path.strip_prefix(data_dir_str.as_ref())
      .unwrap_or(absolute_path)
      .trim_start_matches(|c| c == '/' || c == '\\'); // handles both path separators
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
      .unwrap_or(relative_path) // Should not happen if prefix matches
      .trim_start_matches(|c| c == '/' || c == '\\'); // handles both path separators
    data_dir.join(path_without_placeholder).to_string_lossy().into_owned()
  } else {
    // If path doesn't have placeholder, return as is
    relative_path.to_string()
  }
}

// This function seems unused, can_access_or_create. Keeping it for now.
#[allow(dead_code)]
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
