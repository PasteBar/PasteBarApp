use std::{thread::sleep, time::Duration};

use inputbot::{KeybdKey::*, MouseCursor};

/// This example demonstrates moving the mouse around on the screen both relative to its position,
/// and absolute. To use these functions effectively, you would ideally combine it with a library
/// which exposes your system display resolution, as well as separates different monitors.

fn main() {
    // Bind our 1 key to a function that moves the mouse absolute to your monitors. Note: if you
    // have multiple monitors, 0, 0 might be not where you're expecting. If we wanted to get the
    // absolute position of your primary (or a specific) monitor, we would need to bring in extra
    // libraries.
    Numrow1Key.bind(|| {
        for x in 0..=600 {
            MouseCursor::move_abs(x as i32, 300);
            sleep(Duration::from_millis(1));
        }
    });

    // Bind our 2 key to a function that moves the mouse relative to its current position.
    // This will be 100 pixels over and 100 pixels down.
    Numrow2Key.bind(|| {
        MouseCursor::move_rel(100, 100);
        sleep(Duration::from_millis(1));
    });

    // Call this to start listening for bound inputs.
    inputbot::handle_input_events();
}
