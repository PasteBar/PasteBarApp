# Auto Launch

[![Crates.io](https://img.shields.io/crates/v/auto-launch)](https://crates.io/crates/auto-launch)
[![API reference](https://img.shields.io/docsrs/auto-launch/latest)](https://docs.rs/auto-launch/)
[![License](https://img.shields.io/crates/l/auto-launch)](./LICENSE)

Auto launch any application or executable at startup. Supports Windows, Mac (via AppleScript or Launch Agent), and Linux.

How does it work? See [Teamwork/node-auto-launch](https://github.com/Teamwork/node-auto-launch#how-does-it-work) for details.

If you find any bugs, welcome to PR or issue.

## Usage

The parameters of `AutoLaunch::new` are different on each platform.
See the function definition or the demo below for details.

`AutoLaunchBuilder` helps to eliminate the constructor difference on various platforms.

```rust
use auto_launch::*;

fn main() {
    let auto = AutoLaunchBuilder::new()
        .set_app_name("the-app")
        .set_app_path("/path/to/the-app")
        .set_use_launch_agent(true)
        .build()
        .unwrap();

    auto.enable().unwrap();
    auto.is_enabled().unwrap();

    auto.disable().unwrap();
    auto.is_enabled().unwrap();
}
```

### Linux

```rust
use auto_launch::AutoLaunch;

fn main() {
    let app_name = "the-app";
    let app_path = "/path/to/the-app";
    let auto = AutoLaunch::new(app_name, app_path, &[] as &[&str]);

    // enable the auto launch
    auto.enable().is_ok();
    auto.is_enabled().unwrap();

    // disable the auto launch
    auto.disable().is_ok();
    auto.is_enabled().unwrap();
}
```

### macOS

macOS supports two ways to achieve auto launch (via AppleScript or Launch Agent).
When the `use_launch_agent` is true, it will achieve by Launch Agent, otherwise by AppleScript.

**Note**:

- The `app_path` should be a absolute path and exists. Otherwise, it will cause an error when `enable`.
- In case using AppleScript, the `app_name` should be same as the basename of `app_path`, or it will be corrected automatically.
- In case using AppleScript, only `--hidden` and `--minimized` in `args` are valid, which means that hide the app on launch.

```rust
use auto_launch::AutoLaunch;

fn main() {
    let app_name = "the-app";
    let app_path = "/path/to/the-app.app";
    let auto = AutoLaunch::new(app_name, app_path, false, &[] as &[&str]);

    // enable the auto launch
    auto.enable().is_ok();
    auto.is_enabled().unwrap();

    // disable the auto launch
    auto.disable().is_ok();
    auto.is_enabled().unwrap();
}
```

### Windows

On Windows, it will add registry entries under `\HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Run` and `\HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run`.

It will also detect if startup is disabled inside Task Manager or the Windows settings UI, and can re-enable after being disabled in one of those.

```rust
use auto_launch::AutoLaunch;

fn main() {
    let app_name = "the-app";
    let app_path = "C:\\path\\to\\the-app.exe";
    let auto = AutoLaunch::new(app_name, app_path, &[] as &[&str]);

    // enable the auto launch
    auto.enable().is_ok();
    auto.is_enabled().unwrap();

    // disable the auto launch
    auto.disable().is_ok();
    auto.is_enabled().unwrap();
}
```

## License

MIT License. See the [License](./LICENSE) file for details.

## Acknowledgement

The project is based on [node-auto-launch](https://github.com/Teamwork/node-auto-launch).
