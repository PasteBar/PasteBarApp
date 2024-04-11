use crate::AutoLaunch;
use crate::Result;
use std::fs;
use std::io::Write;
use std::path::PathBuf;

/// Linux implement
impl AutoLaunch {
    /// Create a new AutoLaunch instance
    /// - `app_name`: application name
    /// - `app_path`: application path
    /// - `args`: startup args passed to the binary
    ///
    /// ## Notes
    ///
    /// The parameters of `AutoLaunch::new` are different on each platform.
    pub fn new(app_name: &str, app_path: &str, args: &[impl AsRef<str>]) -> AutoLaunch {
        AutoLaunch {
            app_name: app_name.into(),
            app_path: app_path.into(),
            args: args.iter().map(|s| s.as_ref().to_string()).collect(),
        }
    }

    /// Enable the AutoLaunch setting
    ///
    /// ## Errors
    ///
    /// - failed to create dir `~/.config/autostart`
    /// - failed to create file `~/.config/autostart/{app_name}.desktop`
    /// - failed to write bytes to the file
    pub fn enable(&self) -> Result<()> {
        let data = format!(
            "[Desktop Entry]\n\
            Type=Application\n\
            Version=1.0\n\
            Name={}\n\
            Comment={}startup script\n\
            Exec={} {}\n\
            StartupNotify=false\n\
            Terminal=false",
            self.app_name,
            self.app_name,
            self.app_path,
            self.args.join(" ")
        );

        let dir = get_dir();
        if !dir.exists() {
            fs::create_dir(&dir)?;
        }
        fs::File::create(self.get_file())?.write(data.as_bytes())?;
        Ok(())
    }

    /// Disable the AutoLaunch setting
    ///
    /// ## Errors
    ///
    /// - failed to remove file `~/.config/autostart/{app_name}.desktop`
    pub fn disable(&self) -> Result<()> {
        let file = self.get_file();
        if file.exists() {
            fs::remove_file(file)?;
        }
        Ok(())
    }

    /// Check whether the AutoLaunch setting is enabled
    pub fn is_enabled(&self) -> Result<bool> {
        Ok(self.get_file().exists())
    }

    /// Get the desktop entry file path
    fn get_file(&self) -> PathBuf {
        get_dir().join(format!("{}.desktop", self.app_name))
    }
}

/// Get the autostart dir
fn get_dir() -> PathBuf {
    dirs::home_dir().unwrap().join(".config").join("autostart")
}
