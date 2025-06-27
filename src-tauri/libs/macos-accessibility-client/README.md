# macOS accessibility client

This crate, in its current state, only provides the functionality to query whether the running application is a trusted accessibility client, and if not, display the following rather well known prompt:

<img src="doc/prompt.png" alt="Screenshot of macOS accessibility prompt" width="500">

More functionality may be added in the future. Feel free to open an issue if you think there's something missing.

How to use:

```rust
#[cfg(target_os = "macos")]
fn query_accessibility_permissions() -> bool {
    let trusted = macos_accessibility_client::accessibility::application_is_trusted_with_prompt();
    if trusted {
        print!("Application is totally trusted!");
    } else {
        print!("Application isn't trusted :(");
    }
    return trusted
}

#[cfg(not(target_os = "macos"))]
fn query_accessibility_permissions() -> bool {
    print!("Who knows... 🤷‍♀️");
    return true
}
```


## License

Copyright 2021 Lucas Jenß

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.