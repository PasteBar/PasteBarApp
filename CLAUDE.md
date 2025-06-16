# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PasteBar is a cross-platform clipboard manager built with Tauri (Rust + TypeScript/React). It provides unlimited clipboard history, custom clip management, collections, and advanced features like programming language detection and web scraping.

**Technology Stack:**

- **Backend**: Rust with Tauri framework, Diesel ORM (SQLite), Reqwest, Serde, Tokio
- **Frontend**: TypeScript, React, React Query, Vite, TailwindCSS, Jotai, Zustand
- **Platforms**: macOS and Windows (including Apple Silicon M1, Intel, AMD, and ARM)

## Development Commands

### Prerequisites

First install the Diesel CLI:

```bash
cargo install diesel_cli --no-default-features --features sqlite
```

### Main Development Commands

```bash
# Development (starts both frontend and backend in dev mode)
npm start
# or
npm run dev

# Build for production
npm run build

# Build debug version
npm run app:build:debug

# Platform-specific builds
npm run app:build:osx:universal
npm run app:build:osx:x86_64
npm run app:build:windows:arm

# Database migrations
npm run diesel:migration:run

# Code formatting
npm run format

# Version management
npm run version:sync

# Translation audit
npm run translation-audit
```

### Frontend Development (packages/pastebar-app-ui/)

The frontend is a workspace package that builds separately:

```bash
cd packages/pastebar-app-ui
npm run dev    # Development server on port 4422
npm run build  # Build to dist-ui/
```

### Rust/Tauri Development (src-tauri/)

```bash
cd src-tauri
cargo run --no-default-features  # Development mode
cargo build --release           # Production build
```

## Architecture Overview

### High-Level Structure

**Tauri Architecture**: The app uses Tauri's hybrid architecture where:

- Rust backend handles core functionality (clipboard monitoring, database operations, system integration)
- TypeScript/React frontend provides the UI
- Communication happens via Tauri commands and events

**Core Components:**

1. **Clipboard Monitoring** (`src-tauri/src/clipboard/mod.rs`)

   - Real-time clipboard monitoring using `clipboard-master`
   - Automatic image capture and text processing
   - Language detection for code snippets
   - Configurable exclusion lists and masking

2. **Database Layer** (`src-tauri/src/db.rs` + Diesel)

   - SQLite database with migrations in `migrations/`
   - Custom data location support with path transformation
   - Connection pooling with r2d2

3. **System Integration** (`src-tauri/src/main.rs`)

   - System tray menu with dynamic content
   - Global hotkeys and window management
   - Platform-specific features (macOS accessibility, Windows compatibility)

4. **State Management** (Frontend)
   - Jotai for atomic state management
   - Zustand stores for settings, collections, clipboard history
   - React Query for server state and caching

### Key Patterns

**Path Transformation System**:

- Images are stored with `{{base_folder}}` placeholders for relative paths
- `to_relative_image_path()` and `to_absolute_image_path()` handle conversion
- Enables custom database locations without breaking image references

**Event-Driven Communication**:

- Tauri events for real-time updates between backend and frontend
- Settings synchronization across multiple windows
- Menu rebuilding on state changes

**Multi-Window Architecture**:

- Main window (primary interface)
- History window (clipboard history view)
- QuickPaste window (contextual paste menu)

### Database Schema

Main entities:

- `items` - Custom clips and menu items
- `clipboard_history` - Automatic clipboard captures
- `collections` - Organization containers
- `tabs` - Sub-organization within collections
- `link_metadata` - Web scraping and link preview data
- `settings` - User preferences and configuration

### Frontend Structure

```
packages/pastebar-app-ui/src/
├── components/     # Reusable UI components
├── pages/         # Main application pages
├── store/         # State management (Jotai + Zustand)
├── hooks/         # Custom React hooks
├── lib/           # Utilities and helpers
├── locales/       # Internationalization
└── assets/        # Static assets
```

### Backend Structure

```
src-tauri/src/
├── commands/      # Tauri command handlers
├── services/      # Business logic layer
├── models/        # Database models
├── clipboard/     # Clipboard monitoring
├── menu.rs        # System tray menu
├── db.rs          # Database configuration
└── main.rs        # Application entry point
```

## Important Development Notes

### Settings Management

- Settings are stored as generic key-value pairs in the database
- Frontend uses `settingsStore.ts` with automatic synchronization
- Use `updateSetting()` function and include `invoke('build_system_menu')` for settings that affect the system tray

### Custom Data Locations

- The app supports custom database locations via user settings
- All file operations must use `get_data_dir()`, `get_clip_images_dir()`, etc.
- Path transformation ensures image references work across location changes

### Image Handling

- Images are stored in both thumbnail and full resolution
- Use path transformation helpers when storing/retrieving image paths
- Images support relative paths with `{{base_folder}}` placeholders

### Internationalization

- Backend translations in `src-tauri/src/services/translations/translations.yaml`
- Frontend translations in `packages/pastebar-app-ui/src/locales/lang/`
- Use `t()` function in React components and `Translations::get()` in Rust

### Debug Logging

- Use `debug_output(|| { println!("message") })` in Rust for debug-only logging
- Debug messages only appear in debug builds, keeping release builds clean

### System Tray Menu

- Dynamic menu built from database items and settings
- Rebuild required when items or relevant settings change
- Use `invoke('build_system_menu')` after operations that affect menu content

### Database Migrations

- Use Diesel migrations for schema changes
- Place migration files in `migrations/` directory
- Run migrations with `npm run diesel:migration:run`