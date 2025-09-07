# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Serena Memory Handling
- Always check .serena/memories before starting any work.
- Update .serena/memories at each major work milestone.
- If the number of files under .serena/memories exceeds 5, consolidate and organize them.
- When organizing, keep only content that is useful for future development and operations.

## Project Overview

A lightweight, cross-platform desktop application built with Tauri + React for handling AI-generated Markdown in a workflow of *view first (Viewer)* and *edit as needed (Editor)*.

## Development Commands

### Initial Setup
```bash
# Initialize Vite + React-TS project
npm create vite@latest . -- --template react-ts
npm install

# Add Tauri
cargo install @tauri-apps/cli
cargo tauri init

# Install development dependencies
npm install -D eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### Development
```bash
# Start development server
npm run dev

# Start Tauri development (opens desktop window)
cargo tauri dev
```

### Quality Assurance
```bash
# Run linting
npm run lint

# Run type checking
npm run typecheck

# Build for production
npm run build

# Build Tauri application
cargo tauri build
```

## Architecture

- **Frontend**: React + TypeScript (Vite)
- **Desktop Runtime**: Tauri (Rust)
- **Editor**: CodeMirror 6
- **Markdown Processing**: `react-markdown` + `remark-gfm` + `rehype-highlight`
- **Security**: DOMPurify for XSS protection
- **File System**: `@tauri-apps/api` (fs, dialog)
- **State Management**: React hooks (+ optionally Zustand)

## Key Components Structure

```
src/
├─ components/
│  ├─ Editor.tsx          # Right pane (CodeMirror 6)
│  ├─ Preview.tsx         # Left pane (react-markdown)
│  ├─ SplitPane.tsx       # Resizable split layout
│  └─ Toolbar.tsx         # File operations, theme switch
├─ hooks/
│  ├─ useMarkdown.ts      # MD → HTML pipeline (remark/rehype + sanitize)
│  └─ useScrollSync.ts    # Editor ⇄ Preview scroll sync
├─ utils/
│  ├─ file.ts             # Tauri fs/dialog wrappers
│  └─ settings.ts         # Persist settings (theme/font)
└─ styles/
   ├─ theme.css           # Light/Dark themes
   └─ markdown.css        # Preview styles (GFM-like)
```

## Development Conventions

- **Layout**: Left = Viewer (preview emphasized) / Right = Editor (auxiliary)
- **Realtime Updates**: Edits on the right update the left within 150-250ms
- **Branching**: `main` (stable) / `feat/<topic>` / `fix/<topic>`
- **Commits**: Conventional Commits (e.g. `feat: add split pane layout`)
- **Code Style**: ESLint + Prettier (enforced via CI)

## MVP Development Tasks

The project follows a milestone-based approach with small, focused tasks (2-6h each):

### Phase 1: Core Infrastructure
1. Initialize Vite + TS project → `npm run dev` launches locally
2. Add Tauri → `cargo tauri dev` opens desktop window
3. Setup ESLint/Prettier/Strict TS → `npm run lint` passes
4. Implement SplitPane component with adjustable/persistent ratio

### Phase 2: Editor & Preview
5. Integrate CodeMirror 6 with Markdown input
6. Build Markdown pipeline (GFM tables, checkboxes, code blocks)
7. Create Preview component with styled headings/paragraphs/links
8. Implement realtime reflection (Editor → Preview within 250ms)

### Phase 3: User Experience
9. Add one-way scroll sync (Preview follows editor headings)
10. Create Toolbar with New/Open/Save via Tauri fs/dialog
11. Implement drag & drop file opening
12. Add minimal settings (theme toggle, editor font size)

## Performance Requirements

- **Realtime Reflection**: Preview updates within 250ms, typing ≥60fps
- **Scroll Sync**: Preview follows editor headings within ±1 viewport
- **Security**: All content sanitized via DOMPurify
- **File Handling**: Support files >1MB without lag (future)

## Testing Strategy

- **Unit Tests**: Focus on hooks/utils (`useMarkdown` for headings/code/tables)
- **E2E Tests**: Playwright + Tauri (later phases)
- **Manual Testing**: Layout correctness in Tauri WebView

## Build & Release

- **Windows**: `cargo tauri build` produces `.exe/.msi`
- **Cross-platform**: macOS/Linux packaging in v1.0
- **CI/CD**: GitHub Actions for lint/typecheck/build verification
