use std::{thread::sleep, time::Duration};

use inputbot::{KeybdKey::*, MouseButton::*};

/// This example demonstrates simulating mouse clicks.

fn main() {
    // Bind our right mouse button to a function that autoclicks every 30 milliseconds. Hold it down
    // to bake some cookies really fast!
    RightButton.bind(|| {
        while RightButton.is_pressed() {
            LeftButton.press();
            LeftButton.release();

            sleep(Duration::from_millis(30));
        }
    });

    // Bind our Caps Lock key to a function that toggles autoclicking. Go AFK and bake some
    // cookies really fast without hurting your hands!
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
