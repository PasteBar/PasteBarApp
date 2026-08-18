#![cfg(target_os = "macos")]

use crate::SingleInstanceCallback;
use std::{
  io::{BufWriter, Error, ErrorKind, Read, Write},
  os::unix::net::{UnixListener, UnixStream},
  path::PathBuf,
};
use tauri::{
  plugin::{self, TauriPlugin},
  AppHandle, Manager, RunEvent, Runtime,
};

pub fn init<R: Runtime>(cb: Box<SingleInstanceCallback<R>>) -> TauriPlugin<R> {
  plugin::Builder::new("single-instance")
    .setup(|app| {
      let socket = socket_path(&app.config());

      println!("Single-instance: Socket path: {:?}", socket);

      // First, check if there's a stale socket file and clean it up
      if is_socket_stale(&socket) {
        println!("Single-instance: Cleaning up stale socket from previous crash");
        socket_cleanup(&socket);
      }

      // Notify the singleton which may or may not exist.
      match notify_singleton(&socket) {
        Ok(_) => {
          println!("Single-instance: Found existing instance, exiting");
          std::process::exit(0);
        }
        Err(e) => {
          match e.kind() {
            ErrorKind::NotFound | ErrorKind::ConnectionRefused => {
              println!("Single-instance: No existing instance found, creating new one");
              // This process claims itself as singleton as likely none exists
              socket_cleanup(&socket);
              listen_for_other_instances(&socket, app.clone(), cb);
            }
            _ => {
              println!(
                "Single-instance: Failed to notify existing instance, launching normally: {}",
                e
              );
            }
          }
        }
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
  let socket = socket_path(&manager.config());
  println!("Single-instance: Cleaning up socket on exit: {:?}", socket);
  socket_cleanup(&socket);
}

fn socket_path(config: &tauri::Config) -> PathBuf {
  let identifier = config
    .tauri
    .bundle
    .identifier
    .replace(['.', '-'].as_ref(), "_");

  // Use home directory with .pastebar subdirectory for better organization
  let mut path = if let Some(home) = std::env::var_os("HOME") {
    PathBuf::from(home)
  } else {
    std::env::temp_dir()
  };

  path.push(".pastebar");

  // Create the directory if it doesn't exist
  if let Err(e) = std::fs::create_dir_all(&path) {
    println!("Single-instance: Failed to create app directory: {}", e);
    // Fallback to temp directory
    return PathBuf::from(format!("/tmp/{}_si.sock", identifier));
  }

  path.push(format!("{}_si.sock", identifier));
  path
}

fn socket_cleanup(socket: &PathBuf) {
  if let Err(e) = std::fs::remove_file(socket) {
    // Only log if it's not a "file not found" error
    if e.kind() != ErrorKind::NotFound {
      println!("Single-instance: Warning - failed to remove socket file: {}", e);
    }
  } else {
    println!("Single-instance: Successfully removed socket file");
  }
}

fn is_socket_stale(socket: &PathBuf) -> bool {
  // If socket file doesn't exist, it's not stale
  if !socket.exists() {
    return false;
  }
  
  // Try to connect to see if anyone is listening
  match UnixStream::connect(socket) {
    Ok(_) => {
      // Someone is listening, socket is active
      false
    }
    Err(e) => {
      // Connection failed, socket is likely stale
      match e.kind() {
        ErrorKind::ConnectionRefused | ErrorKind::NotFound => {
          println!("Single-instance: Detected stale socket file, will clean up");
          true
        }
        _ => {
          println!("Single-instance: Unexpected error testing socket: {}", e);
          false
        }
      }
    }
  }
}

fn notify_singleton(socket: &PathBuf) -> Result<(), Error> {
  println!("Single-instance: Trying to notify existing instance");
  let stream = UnixStream::connect(socket)?;
  let mut bf = BufWriter::new(&stream);
  let cwd = std::env::current_dir()
    .unwrap_or_default()
    .to_str()
    .unwrap_or_default()
    .to_string();
  bf.write_all(cwd.as_bytes())?;
  bf.write_all(b"\0\0")?;
  let args_joined = std::env::args().collect::<Vec<String>>().join("\0");
  bf.write_all(args_joined.as_bytes())?;
  bf.flush()?;
  drop(bf);
  println!("Single-instance: Successfully notified existing instance");
  Ok(())
}

fn listen_for_other_instances<A: Runtime>(
  socket: &PathBuf,
  app: AppHandle<A>,
  mut cb: Box<SingleInstanceCallback<A>>,
) {
  // Ensure socket is clean before binding
  socket_cleanup(socket);
  
  match UnixListener::bind(socket) {
    Ok(listener) => {
      println!("Single-instance: Successfully bound to socket, listening for other instances");
      tauri::async_runtime::spawn(async move {
        for stream in listener.incoming() {
          match stream {
            Ok(mut stream) => {
              println!("Single-instance: Received connection from another instance");
              let mut s = String::new();
              match stream.read_to_string(&mut s) {
                Ok(_) => {
                  let (cwd, args) = s.split_once("\0\0").unwrap_or_default();
                  let args: Vec<String> = args.split('\0').map(String::from).collect();
                  println!(
                    "Single-instance: Calling callback for new instance with args: {:?}",
                    args
                  );
                  cb(&app, args, cwd.to_string());
                }
                Err(e) => {
                  println!("Single-instance: Failed to read from stream: {}", e);
                }
              }
            }
            Err(err) => {
              println!("Single-instance: Failed to accept connection: {}", err);
              continue;
            }
          }
        }
      });
    }
    Err(err) => {
      println!(
        "Single-instance: Failed to bind socket ({}), trying to clean up and retry once",
        err
      );
      
      // Try cleaning up and retrying once more
      socket_cleanup(socket);
      match UnixListener::bind(socket) {
        Ok(listener) => {
          println!("Single-instance: Successfully bound to socket on retry");
          // Same listening logic as above
          tauri::async_runtime::spawn(async move {
            for stream in listener.incoming() {
              match stream {
                Ok(mut stream) => {
                  println!("Single-instance: Received connection from another instance");
                  let mut s = String::new();
                  match stream.read_to_string(&mut s) {
                    Ok(_) => {
                      let (cwd, args) = s.split_once("\0\0").unwrap_or_default();
                      let args: Vec<String> = args.split('\0').map(String::from).collect();
                      println!(
                        "Single-instance: Calling callback for new instance with args: {:?}",
                        args
                      );
                      cb(&app, args, cwd.to_string());
                    }
                    Err(e) => {
                      println!("Single-instance: Failed to read from stream: {}", e);
                    }
                  }
                }
                Err(err) => {
                  println!("Single-instance: Failed to accept connection: {}", err);
                  continue;
                }
              }
            }
          });
        }
        Err(retry_err) => {
          println!(
            "Single-instance: Failed to bind socket even after cleanup, launching normally: {}",
            retry_err
          );
        }
      }
    }
  }
}
