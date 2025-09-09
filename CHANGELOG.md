# Changelog

## 0.2.1 (2025-09-09)

### Fixes
- editor: Fix caret position shifting right by one character in CodeMirror by removing `.cm-scroller` padding/gutter.

### CI/CD
- ci: Re-enable Linux builds in CI (Ubuntu) and release pipeline; publish AppImage and DEB artifacts.

### Docs
- readme: Update platform download links to v0.2.1 and note Linux artifacts availability.

## 0.2.0 (2025-09-07)

### Features
- preview: Add Preview-only view mode and toggle (Ctrl+Shift+P).
- settings: Persist `viewMode` (default `split`).

### UI
- toolbar: Replace emojis with Lucide icons (FilePlus, FolderOpen, Save, Settings).
- toolbar: Add accessible slide switch for “Preview Only”.

### Tests
- Add tests for toolbar toggle and layout in both modes.

### Build
- Verified web and Tauri desktop builds.
