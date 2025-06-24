# pastebar-app

## 0.7.0

### Minor Changes

- d491faf: Added keyboard shortcuts to improve navigation efficiency within the application
- e5e8123: Added custom data location to store application data in a folder of your choice instead of the default location.

### Patch Changes

- c099e41: Added long press on clip to activate clips organize
- a8e3fc8: Added Trim Spaces option for the Clip
  Added Auto Trim Spaces option for the History Capture
- a7ec7eb: Added: Quick history window user options
- e5e8123: Added option to disable capturing and storing images from clipboard
- 14610ff: Implement clipboard history filtering based on text length limits
- bb7dc8f: Added support setting hotkeys with up to 3-key combinations
- 061001f: Fix: update history items in quick paste window after delete operation in main window
- bed49e2: Added user setting for single-click keyboard focus in history
- 1191b9b: refactor: update terminology for history window split to open
- 4ad66e1: Updates: React 19 and React Compiler
- 558d25f: Auto-activate search in quick paste window when typing any letter or number
- a7df032: Added single-click copy/paste option in user preferences
- 87148d2: Added persistent note icons for clips with descriptions
- 72c595c: Added detect and select language modal on first app run
- f12c0e2: Fix: refresh native menu on history items delete
- c10ec63: Added: history item preview max lines user setting
- cdf7752: Added protected collection with PIN access
- e831a28: Added Special copy/paste for history items context menu and settings
- 07d0bb6: Added Backup and Restore database and images
- 16428c5: Added global templates in user preferences for saved clips
- bf53da7: Press Delete key to delete single or multiple items with confirmation on second press
- 83c3de1: Added: customizable tray icon behavior on Windows as user settings
- 0af0554: Added user preference to copy only menu items to clipboard without auto-pasting
- 385d661: Fix: enhance value preview logic to fix text overflow
- a00cb44: Updated French language translation from Jean-Michel Robert
- df2d4cb: Added deleting menu folders with children by moving submenus up one level
- 4ad66e1: User preferences UI color bug for languages
- 64bdb03: Added settings to preserve pinned and starred items when clearing clipboard history
- 0c7ed93: Added option "Show Always on Top" for main window
- ecee8d2: Support for notes matching in global search
- a00cb44: Added Turkish language translation by AlijonMurodov

## 0.6.2

### Patch Changes

- fb264f6: Update to shortcut for quick copy paste ctrl + number added cmd key press on mac

## 0.6.1

### Patch Changes

- cf24d8f: Fix: Autogenerate link settings not working in Quick Paste Window

## 0.6.0

### Minor Changes

- 78957f4: Added support for zhCN Simplified Chinese language translation (thanks to @katelya77)
  Added support for UK Ukrainian language with auto-generated translation (seeking help to improve)
  Added support for esES Spanish language with auto-generated translation (seeking help to improve)
  Added support for IT Italian language with auto-generated translation (seeking help to improve)
  Added data-fn locale for each language
  Added global hotkeys for show/hide the main app window option
  Added global hotkeys for show/hide Quick Paste window near user's current cursor position
  Added hide the app dock icon (macOS) option
  Added "The app starts with main window hidden" option
  Added "Show navbar elements on hover only" option
  Added "Hide collections name on the navbar" option
  Added PasteBar Quick Paste window with keyboard navigation, Enter or Ctrl + [number] to paste, Ctrl + F to search
  Added Ctrl + click or Cmd + click to multi select/deselect history items
  Fixed a bug where the contact form used an invalid link on Windows (#125)
  Fixed a bug causing a markdown undefined error on window

## 0.5.2

### Patch Changes

- 84d2007: Added excluded apps list in clipboard settings
  Added copied item source app hover indicator on history item
  Added "Exclude Source App and Delete" option in history item context menu
  Added "Add to Filter by Source App" option in history item context menu
  Added new source app filter in history filters

## 0.5.1

### Patch Changes

- New: After paste key press clip option

## 0.5.0

### Minor Changes

- Free and Open Source Release

## 0.3.0

### Minor Changes

- New: Integrated Audio Player with playlist support for both local and remote MP3 files.
  New: Clipboard history now accessible in a separate window from the main interface.
  New: Automatically generate card links in clipboard history.
  New: Auto preview for X.com (Twitter) links in clips.
  New: Auto preview for Instagram links in clips.
  New: Auto preview for YouTube links in clipboard history and clips.
  Fixed: Issue with clearing clipboard history, now includes option to delete recent items.

## 0.2.5

### Patch Changes

- Added Application Submission Error Report Page

## 0.2.4

### Patch Changes

- Added Application Submission Error Report Page

## 0.2.3

### Patch Changes

- New Version Release Notes Markdown View

## 0.2.2

### Patch Changes

- React compiler added to build frontend ui

## 0.2.1

### Patch Changes

- Contact Form and Pro Support Form added

## 0.2.0

### Minor Changes

- Added Application Guided Tours

### Patch Changes

- Window size auto update in min size detection
- Move to position added to context menu for clips and boards
- Updated hardware uuid detection for Mac and Windows

## 0.0.22

### Patch Changes

- Larger view for board with expand/collapse functionality

## 0.0.21

### Patch Changes

- Code viewer for markdown added render HTML view

## 0.0.20

### Patch Changes

- Save clip saves clip name if edit active

## 0.0.19

### Patch Changes

- Added user preferences for clip notes hover delay
- Edit clip name direct context menu
- Auto check for system permissions in accessibility preferences on Mac OSX

## 0.0.18

### Patch Changes

- Code viewer for markdown added render HTML view
- Clip notes popup maximum dimensions user preferences

## 0.0.15

### Patch Changes

- Added user preferences for clip notes hover delay

## 0.0.14

### Patch Changes

- Prioritized languages list settings
- History and Menu panel size adaptive change

## 0.0.13

### Patch Changes

- Prioritized languages list settings

## 0.0.12

### Patch Changes

- History and Menu panel size adaptive change

## 0.0.8

### Patch Changes

- Update to Dark Theme for Global Search

## 0.0.5

### Patch Changes

- Added Lock Screen and Security Settings for Applcation
