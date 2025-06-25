# Tauri ARM64 Build Guide for Windows

## Prerequisites

### 1. Install Rust ARM64 Target
Open a terminal/command prompt and run:
```bash
rustup target add aarch64-pc-windows-msvc
```

### 2. Install ARM64 Build Tools
You need Visual Studio with ARM64 support:
- Install Visual Studio 2022 (Community edition is fine)
- During installation, select:
  - **Desktop development with C++**
  - **MSVC v143 - VS 2022 C++ ARM64/ARM64EC build tools**
  - **Windows 11 SDK (10.0.22000.0 or later)**

### 3. Verify Installation
```bash
# Check if ARM64 target is installed
rustup target list | findstr aarch64-pc-windows-msvc

# Should show: aarch64-pc-windows-msvc (installed)
```

## Build Configuration

### Understanding vcvarsall.bat Parameters
The `vcvarsall.bat` script accepts different parameters for different build scenarios:
- `x64` - Build x64 apps on x64 host
- `x86` - Build x86 apps
- `x64_arm64` - Build ARM64 apps on x64 host (cross-compilation)
- `x64_arm` - Build ARM apps on x64 host
- `arm64` - Build ARM64 apps on ARM64 host (native)

For building ARM64 apps on a regular x64 Windows machine, use `x64_arm64`.

### 2. Check `package.json` Script
Verify your build script is configured correctly:
```json
{
  "scripts": {
    "app:build:windows:arm": "tauri build --target aarch64-pc-windows-msvc"
  }
}
```

## Build Process

### Step 1: Set Up Build Environment
You need to configure the Visual Studio build tools for ARM64 cross-compilation:

**Option A: Using vcvarsall.bat (Recommended)**
Open a regular Command Prompt and run:
```cmd
"C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64_arm64
```

**Note:** The path might be different based on your Visual Studio installation:
- **Build Tools:** `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat`

After running this command, you should see:
```
**********************************************************************
** Visual Studio 2022 Developer Command Prompt v17.x.x
** Copyright (c) 2022 Microsoft Corporation
**********************************************************************
[vcvarsall.bat] Environment initialized for: 'x64_arm64'
```

**Option B: Using Developer Command Prompt**
Alternatively, open "x64_arm64 Cross Tools Command Prompt for VS 2022" from Start Menu.

### Step 2: Set Environment Variables
In the same command prompt window (after running vcvarsall.bat):

**Command Prompt:**
```cmd
set TAURI_PRIVATE_KEY=....your-full-key-here
```

### Step 2: Clean Previous Builds (Optional)
```bash
# Remove old build artifacts
npm run clean
# or manually
rmdir /s /q src-tauri\target
```

### Step 3: Install Dependencies
```bash
# Ensure all dependencies are installed
npm install
cd src-tauri
cargo update
cd ..
```

### Step 4: Build for ARM64
Run your build command:
```bash
npm run app:build:windows:arm
```

### Step 5: Monitor Build Progress
The build process will:
1. Compile Rust code for ARM64
2. Build the frontend
3. Package everything into an installer

Expected output:
```
   Compiling your-app v0.1.0 (src-tauri)
    Finished release [optimized] target(s) in X.XXs
    Bundling your-app_0.1.0_arm64-setup.exe
    Bundling your-app_0.1.0_arm64.msi
    Finished 2 bundles
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "Target not found" Error
```bash
# Fix: Install the target
rustup target add aarch64-pc-windows-msvc
```

#### 2. "Cannot find link.exe" Error
**Solution:** Set up the build environment properly:
```cmd
# Run this first:
"C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64_arm64

# Then try building again
npm run app:build:windows:arm
```

Alternative fixes:
- Ensure Visual Studio ARM64 tools are installed
- Restart your terminal after VS installation
- Use the correct vcvarsall.bat path for your VS edition

#### 3. Build Fails with Signing Error
```bash
# Ensure your private key is set correctly
echo %TAURI_PRIVATE_KEY%  # Should show your key
```

#### 4. Memory Issues During Build
Add to `src-tauri/.cargo/config.toml`:
```toml
[build]
jobs = 2  # Reduce parallel jobs

[target.aarch64-pc-windows-msvc]
linker = "lld-link.exe"  # Use faster linker
```

### Build from VS Developer Command Prompt
For best results, use one of these methods:

**Method 1: Using vcvarsall.bat (Flexible)**
```cmd
# Open regular Command Prompt, then run:
"C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64_arm64
```

**Why use vcvarsall.bat?**
- Sets up all necessary paths for ARM64 cross-compilation
- Configures the linker and compiler for x64 to ARM64 builds
- Ensures all Visual Studio tools are available in PATH

## Verify Build Output

After successful build, check:
```
src-tauri\target\aarch64-pc-windows-msvc\release\bundle\
├── msi\
│   └── YourApp_0.1.0_arm64.msi
└── nsis\
    └── YourApp_0.1.0_arm64-setup.exe
```

## Quick Command Reference

```bash
# Full build sequence
rustup target add aarch64-pc-windows-msvc

# Set up build environment (use your VS path)
"C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64_arm64

# Set environment variables
set TAURI_PRIVATE_KEY=your-key-here

# Build
npm install
npm run app:build:windows:arm
```

### All-in-One Command (Command Prompt)
```cmd
rustup target add aarch64-pc-windows-msvc && "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64_arm64 && set TAURI_PRIVATE_KEY=your-key-here && npm install && npm run app:build:windows:arm
```