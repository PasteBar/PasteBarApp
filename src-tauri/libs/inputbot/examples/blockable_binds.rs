use inputbot::{BlockInput::*, KeybdKey::*};

// This example demonstrates blocking input with conditional flags, such as another key being
// pressed or toggled. This example currently does not work on Linux.

fn main() {
    // Block the A key when left shift is held. Note: callbacks for blockable binds won't be
    // executed in new threads, so for long-running processes create new threads inside the callback
    // if needed.
    AKey.blockable_bind(|| {
        if LShiftKey.is_pressed() {
            Block
        } else {
            DontBlock
        }
    });

    // Block the K key when left shift is held.
    KKey.block_bind(|| ());

    // Call this to start listening for bound inputs.
    inputbot::handle_input_events();
}
