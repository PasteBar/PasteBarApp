# InputBot [![docs link](https://docs.rs/inputbot/badge.svg)](https://docs.rs/inputbot) [![crates.io version](https://img.shields.io/crates/v/inputbot.svg)](https://crates.io/crates/inputbot) 
Cross-platform (Windows & Linux) library for simulating keyboard/mouse input events and registering global input device event handlers.

Allows writing automation programs that collapse long action-sequences into single key-presses.

## Usage

```toml
[dependencies]
inputbot = "0.5"
```

```rust
use inputbot::{KeySequence, KeybdKey::*, MouseButton::*};
use std::{thread::sleep, time::Duration};

fn main() {
    // Bind the number 1 key your keyboard to a function that types 
    // "Hello, world!" when pressed.
    Numrow1Key.bind(|| KeySequence("Hello, world!").send());

    // Bind your caps lock key to a function that starts an autoclicker.
    CapsLockKey.bind(move || {
        while CapsLockKey.is_toggled() {
            LeftButton.press();
            LeftButton.release();

            sleep(Duration::from_millis(30));
        }
    });

    // Call this to start listening for bound inputs.
    inputbot::handle_input_events();
}
```

*NOTE: The README and examples are based off the `develop` branch of InputBot. If a feature is not working, you are probably using the version from crates.io. If you want to use the latest build, add this to your Cargo.toml:*

```toml
[dependencies]
inputbot = { git = "https://github.com/obv-mikhail/InputBot", branch = "develop" }
```

Check out **[examples](/examples)** for comprehensive examples on how to use each feature.

## Build Dependencies

### Debian or Ubuntu based distros

* **libx11-dev**
* **libxtst-dev**
* **libudev-dev**
* **libinput-dev**

**Note:** libinput requires InputBot to be run with sudo on Linux - `sudo ./target/debug/<program name>`.

## Examples

You can run the included examples by cloning the library and running `cargo run --example <example name>`. Similar to the note above, on Linux you have to run `cargo build --examples && sudo ./target/debug/<example name>`.

This is especially useful for testing the library when contributing.
