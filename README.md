# MarkReview

A lightweight, cross-platform desktop application built with Tauri + React for handling AI-generated Markdown in a workflow of *view first (Viewer)* and *edit as needed (Editor)*.

## Features

- **Split-pane Layout**: Left pane for preview (primary), right pane for editor (auxiliary)
- **Real-time Preview**: Edits update preview within 150-250ms
- **Markdown Support**: Full GitHub Flavored Markdown (GFM) with tables, checkboxes, and code blocks
- **Syntax Highlighting**: Code blocks with syntax highlighting support
- **File Operations**: New, Open, Save with native file dialogs
- **Drag & Drop**: Drop `.md` files directly into the editor
- **Customizable**: Theme toggle (light/dark) and customizable keyboard shortcuts
- **Scroll Sync**: Preview follows editor cursor position
- **Cross-platform**: Windows, macOS, Linux support
- **Lightweight**: Built with Tauri for smaller binary size compared to Electron

## Installation

### Download Pre-built Binaries

Download the latest release from the [Releases page](../../releases).

- **Windows**: Download `.exe` or `.msi` installer
- **macOS**: Download `.dmg` file (Coming soon)
- **Linux**: Download `.AppImage` or `.deb` package (Coming soon)

### Build from Source

#### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://rustup.rs/) (latest stable)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites/)

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

3. Install Tauri CLI (if not already installed):
```bash
cargo install @tauri-apps/cli
```

4. Run in development mode:
```bash
npm run tauri:dev
```

5. Build for production:
```bash
npm run tauri:build
```

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

- **Frontend**: React 19 + TypeScript + Vite
- **Desktop**: Tauri 2.x (Rust)
- **Editor**: CodeMirror 6
- **Markdown**: react-markdown + remark-gfm
- **Styling**: CSS with CSS variables for theming
- **State**: React hooks + localStorage for settings

## Keyboard Shortcuts

Default shortcuts (customizable in Settings):

- `Ctrl+N` - New file
- `Ctrl+O` - Open file
- `Ctrl+S` - Save file
- `Ctrl+F` - Find in editor
- `Ctrl+,` - Open settings

## Privacy

**No Telemetry**: This application does not collect any user data or send any information to external servers. All data remains on your local machine.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Tauri](https://tauri.app/) for cross-platform desktop apps
- Markdown processing powered by [react-markdown](https://github.com/remarkjs/react-markdown)
- Code editing with [CodeMirror 6](https://codemirror.net/6/)
- Syntax highlighting by [highlight.js](https://highlightjs.org/)