# Tauri Plugin single-instance
## Emit Event Example

To build and test in development mode run the following:

```sh
# change to this example directory
npm install
npm run tauri dev

# or if tauri is installed globally

cargo tauri dev
```

While the above is running, in a separate terminal window execute the debug target app

```sh
# on linux
./src-tauri/target/debug/emit-event-app cyan # any css background color should work
./src-tauri/target/debug/emit-event-app "#888" # including hex

# on windows
.\src-tauri\target\debug\emit-event-app.exe cyan
```
