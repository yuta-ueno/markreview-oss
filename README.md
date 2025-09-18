# MarkReview

[![Latest Release](https://img.shields.io/github/v/release/yuta-ueno/markreview?display_name=release&sort=semver)](https://github.com/yuta-ueno/markreview/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/yuta-ueno/markreview/total?logo=github)](https://github.com/yuta-ueno/markreview/releases)
[![CI](https://github.com/yuta-ueno/markreview/actions/workflows/ci.yml/badge.svg)](https://github.com/yuta-ueno/markreview/actions/workflows/ci.yml)

A lightweight, cross‑platform desktop application built with Tauri 2 + React for working with Markdown in a workflow of view first (Preview) and edit as needed (Editor).

> Note (OSS Edition): This repository builds the OSS edition only.
> Pro builds are intentionally disabled here. The `:pro` npm scripts
> will error, and the build flag `import.meta.env.MARKREVIEW_PRO`
> is forced to `false` in this repo.

## Features

- Split‑pane layout: left Preview (primary), right Editor (auxiliary)
- Near real‑time preview: typical 150–250ms update latency
- Markdown: full GFM (tables, task lists, code blocks)
- Syntax highlighting (rehype-highlight)
- File operations: New / Open / Save via native dialogs (Tauri) or download (web)
- Drag & Drop: drop `.md`, `.markdown`, `.txt`
- Themes: GitHub Light/Dark + Auto (core). Solarized Light/Dark, Nord, Monokai are Pro-only.
- Editor customization: font size/family, tab size, word wrap (CodeMirror 6)
- Scroll sync: preview follows editor position
- Large files optimized: chunked processing + optional virtualization for big inputs
- Desktop‑class footprint: Tauri binaries are small compared to Electron

## Installation

### Download

- Latest release: https://github.com/yuta-ueno/markreview/releases/latest

Platform assets for v0.2.2:
- Windows (NSIS installer): https://github.com/yuta-ueno/markreview/releases/latest/download/MarkReview_0.2.3_x64-setup.exe
- macOS (DMG): https://github.com/yuta-ueno/markreview/releases/latest/download/MarkReview_0.2.3_x64.dmg

Notes:
- Linux builds are temporarily excluded from this release due to CI capacity; they will return in a subsequent version.
- macOS install: open the downloaded DMG and drag “MarkReview” into Applications. If Gatekeeper blocks the app, open System Settings → Privacy & Security and click “Open Anyway” for MarkReview.

### Build from Source

#### Prerequisites

- Node.js >= 20.19 or >= 22.12 (recommend 22 LTS)
- Rust (stable) and platform toolchains for Tauri
  - Windows: Visual Studio C++ Build Tools + NSIS for installer packaging
  - macOS/Linux: standard build toolchain per Tauri docs

#### Build Steps

1. Clone the repository:
```bash
git clone https://github.com/your-username/markreview.git
cd markreview
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run tauri:dev
```

4. Build for production:
```bash
npm run tauri:build
```

The desktop bundles are produced under `src-tauri/target/release/bundle/`.

## Development

### Project Structure

```
├─ src/                     # React frontend
│  ├─ components/
│  │  ├─ Editor.tsx         # CodeMirror 6 editor
│  │  ├─ Preview.tsx        # Markdown preview
│  │  ├─ SplitPane.tsx      # Resizable layout
│  │  └─ Toolbar.tsx        # File operations
│  ├─ hooks/
│  │  ├─ useMarkdown.ts     # Markdown processing
│  │  └─ useScrollSync.ts   # Scroll synchronization
│  └─ utils/
├─ src-tauri/               # Rust backend
└─ .github/workflows/       # CI/CD
```

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run tauri:dev` - Start Tauri development with hot reload
- `npm run build` - Build React app for production
- `npm run tauri:build` - Build Tauri desktop application
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

### Tech Stack

- Frontend: React 19 + TypeScript + Vite
- Desktop: Tauri 2.x (Rust)
- Editor: CodeMirror 6
- Markdown pipeline: unified + remark-parse/remark-gfm + remark-rehype + rehype-highlight + rehype-stringify
- Security: DOMPurify sanitization of generated HTML
- Styling: CSS with CSS variables (theme packs for preview + app UI)
- Settings: File‑based (AppData) primary with localStorage fallback/migration

## Keyboard Shortcuts

Default shortcuts (customizable in Settings):

- `Ctrl+N` - New file
- `Ctrl+O` - Open file
- `Ctrl+S` - Save file
- `Ctrl+F` - Find in editor
- `Ctrl+,` - Open settings
- `Ctrl+Shift+P` - Toggle Preview Only

## Privacy

No Telemetry: this application does not collect or transmit data. All processing is local. You can verify with `npm run verify:no-telemetry`.

### Settings Storage
- Windows: `%APPDATA%/MarkReview/settings.json`
- macOS: `~/Library/Application Support/MarkReview/settings.json`
- Linux: `~/.local/share/MarkReview/settings.json`

On first run, legacy localStorage settings are migrated to the file store (and kept as backup).

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with Tauri for cross‑platform desktop apps
- Markdown processing powered by unified/remark/rehype
- Code editing with CodeMirror 6
- Syntax highlighting by rehype‑highlight

---

### For Contributors
- To resume a session quickly, run: `npm run status` (and `npm run status:health` for typecheck/tests). See AGENTS.md for details.
