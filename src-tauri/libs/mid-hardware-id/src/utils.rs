use crate::MIDError;
use std::{ffi::OsStr, process::Command};

#[macro_export]
macro_rules! debug {
    ($($arg:tt)*) => {
        if cfg!(debug_assertions) {
            println!($($arg)*);
        }
    };
}
