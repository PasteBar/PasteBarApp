use inputbot::{KeySequence, KeybdKey::*};

/// This example demonstrates sending sequences of key presses / characters via a KeySequence.
/// This can be used, for example, to create a macro which types a specific string.

fn main() {
    // If you are on Linux, you may wish to call this function first to avoid a startup delay when
    // the fake device is created. Otherwise, your first input event - if it is a key sequence - may
    // have missing characters.
    //     inputbot::init_device();

    // Bind our Backquote key (`, ~) to a function that types out the string "Hello, world!".
    // You must remember to call the `.send()` method on the KeySequence after creating it.
    // You could explicitly define the KeySequence ahead of time and send it later like so:
    //      let seq: KeySequence = KeySequence("Hello, world!");
    //      seq.send();
    BackquoteKey.bind(|| {
        KeySequence("Hello, world!").send();
    });

    // Call this to start listening for bound inputs.
    inputbot::handle_input_events();
}
