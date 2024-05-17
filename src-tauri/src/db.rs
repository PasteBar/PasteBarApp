use lazy_static::lazy_static;
use once_cell::sync::OnceCell;
use serde::Serialize;
use std::fs;
use std::path::Path;
use std::path::PathBuf;
use std::time::Duration;

use diesel::connection::SimpleConnection;
use diesel::prelude::*;
use diesel::r2d2 as diesel_r2d2;

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
  pub static ref DB_POOL_CONNECTION: Pool = init_connection_pool();
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

fn adjust_canonicalization<P: AsRef<Path>>(p: P) -> String {
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

fn get_db_path() -> String {
  if cfg!(debug_assertions) {
    let app_dir = APP_CONSTANTS.get().unwrap().app_dev_data_dir.clone();
    let path = if cfg!(target_os = "macos") {
      format!(
        "{}/local.pastebar-db.data",
        adjust_canonicalization(app_dir)
      )
    } else if cfg!(target_os = "windows") {
      format!(
        "{}\\local.pastebar-db.data",
        adjust_canonicalization(app_dir)
      )
    } else {
      format!(
        "{}/local.pastebar-db.data",
        adjust_canonicalization(app_dir)
      )
    };

    path
  } else {
    let app_data_dir = APP_CONSTANTS.get().unwrap().app_data_dir.clone();
    let data_dir = app_data_dir.as_path();

    let path = if cfg!(target_os = "macos") {
      format!("{}/pastebar-db.data", adjust_canonicalization(data_dir))
    } else if cfg!(target_os = "windows") {
      format!("{}\\pastebar-db.data", adjust_canonicalization(data_dir))
    } else {
      format!("{}/pastebar-db.data", adjust_canonicalization(data_dir))
    };

    path
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
