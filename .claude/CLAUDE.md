# CLAUDE.MD — Tauri + React Markdown Viewer/Editor

> Goal: Provide a lightweight, cross‑platform desktop application (built with Tauri + React) for handling **AI‑generated Markdown** in a workflow of *view first (Viewer)* and *edit as needed (Editor)*. OSS‑ready.

---

## 0. Highlights (Product Direction)
- **Layout**: Left = Viewer (preview emphasized) / Right = Editor (auxiliary)
- **Realtime**: Edits on the right update the left instantly
- **Lightweight**: Use **Tauri** instead of Electron (smaller binaries)
- **Extensible**: Start with Markdown/GFM, introduce Stripe’s **Markdoc** gradually (no toggle)
- **OSS**: MIT or Apache‑2.0 license, PR‑friendly process

---

## 1. Architecture
- **UI**: React + TypeScript (Vite)
- **Editor**: CodeMirror 6 (lightweight, extensible)
- **Markdown**: `react-markdown` + `remark-gfm` (tables, checkboxes, etc.)
- **Highlighting**: `rehype-highlight` (optionally Prism/Shiki later)
- **Sanitize**: `DOMPurify` (XSS protection)
- **Native**: Tauri (Rust)
- **FS/Dialogs**: `@tauri-apps/api` (fs, dialog)
- **State**: React hooks (+ optionally Zustand)
- **Settings Storage**: Tauri Store or JSON config

---

## 2. Suggested Directory Structure
```
project-root/
├─ src/
│  ├─ components/
│  │   ├─ Editor.tsx          # Right pane (CodeMirror 6)
│  │   ├─ Preview.tsx         # Left pane (react-markdown)
│  │   ├─ SplitPane.tsx       # Resizable split layout
│  │   └─ Toolbar.tsx         # File operations, theme switch, etc.
│  ├─ hooks/
│  │   ├─ useMarkdown.ts      # MD → HTML pipeline (remark/rehype + sanitize)
│  │   └─ useScrollSync.ts    # Editor ⇄ Preview scroll sync
│  ├─ utils/
│  │   ├─ file.ts             # Tauri fs/dialog wrappers
│  │   └─ settings.ts         # Persist settings (theme/font)
│  ├─ styles/
│  │   ├─ theme.css           # Light/Dark themes
│  │   └─ markdown.css        # Preview styles (GFM‑like)
│  ├─ App.tsx
│  └─ main.tsx
├─ public/
│  └─ index.html
├─ src-tauri/
│  ├─ src/
│  │   └─ main.rs             # Tauri entry point
│  ├─ tauri.conf.json
│  └─ Cargo.toml
├─ .github/
│  ├─ workflows/
│  │   └─ ci.yml              # CI: build/typecheck/lint
│  ├─ ISSUE_TEMPLATE.md
│  └─ PULL_REQUEST_TEMPLATE.md
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ README.md
└─ LICENSE
```

---

## 3. Conventions
- **Branching**: `main` (stable) / `feat/<topic>` / `fix/<topic>`
- **Commits**: Conventional Commits (e.g. `feat: add split pane layout`)
- **Code Style**: ESLint + Prettier (enforced via CI)
- **Tests**: unit (hooks/utils) + later E2E (Playwright + Tauri)
- **Review**: 2 approvals or 1 approval + green CI

---

## 4. Milestones & Fine‑Grained Tasks (Backlog)
> All tasks are **small (2–6h, T‑shirt size S)**. Each task has a Definition of Done (DoD).

### Milestone v0.1 — MVP (Viewer primary / Editor auxiliary / realtime)

**MVP‑001: Initialize Vite + TS project**
- DoD: `npm run dev` launches locally

**MVP‑002: Add Tauri**
- DoD: `tauri dev` opens a desktop window

**MVP‑003: ESLint/Prettier/Strict TS**
- DoD: `npm run lint` passes, CI green

**MVP‑004: SplitPane Component**
- DoD: Pane ratio adjustable and persisted

**MVP‑005: Editor (CodeMirror 6)**
- DoD: Markdown input works, Tab/Undo/Redo functional

**MVP‑006: Markdown Pipeline**
- DoD: GFM tables, checkboxes, code blocks rendered and sanitized

**MVP‑007: Preview Component**
- DoD: Headings/paragraphs/links styled via `markdown.css`

**MVP‑008: Realtime Reflection**
- DoD: Editor updates Preview within 150–250ms without lag

**MVP‑009: Scroll Sync (one‑way)**
- DoD: Preview follows editor heading position within ±1 viewport

**MVP‑010: Toolbar (New/Open/Save)**
- DoD: New/Load/Save works via Tauri fs/dialog

**MVP‑011: Drag & Drop File Open**
- DoD: Drop `.md` into editor loads file, error toast on failure

**MVP‑012: Minimal Settings**
- DoD: Theme toggle and editor font size persist

**MVP‑013: Keyboard Shortcuts**
- DoD: Ctrl+N/O/S, Ctrl+F (editor search) functional

**MVP‑014: Windows Packaging**
- DoD: `tauri build` produces working `.exe/.msi`

**MVP‑015: CI (lint/typecheck/build dry‑run)**
- DoD: GitHub Actions run and pass on PRs

**MVP‑016: Documentation**
- DoD: README (usage/build), LICENSE, CONTRIBUTING added

**MVP‑017: Error Handling/Toast**
- DoD: File I/O failures surface non‑blocking error notifications

**MVP‑018: Telemetry disabled**
- DoD: README states “no telemetry”, verified no external requests

**MVP‑019: Minimal Unit Tests**
- DoD: `useMarkdown` tested (headings/code/tables), CI green

**MVP‑020: Release v0.1**
- DoD: GitHub Release with binaries + checksums, verified launch

### Milestone v0.5 — UX Enhancements
- THEME‑001: Improve dark theme (syntax highlight colors)
- EXPORT‑001: HTML export
- EXPORT‑002: PDF export (print CSS)
- UX‑001: Editor helpers (insert heading/list/link)
- SYNC‑002: Bi‑directional scroll sync
- PERF‑001: Handle >1MB files without lag
- DND‑001: Image D&D → relative path insert

### Milestone v1.0 — Stable
- CROSS‑001: macOS/Linux packaging and testing
- DOC‑001: User guide (keybinds/FAQ)
- I18N‑001: Basic i18n (en/ja)
- PLUG‑001: Extension API (PlantUML, math, etc.)
- MARKDOC‑001: Incremental Markdoc support (tags/vars, no toggle)

---

## 5. Acceptance Criteria (Examples)
**MVP‑008 (Realtime Reflection)**
- Preview updates within 250ms of input
- Typing remains ≥60fps (no stutter)
- Malicious scripts sanitized (DOMPurify)

**MVP‑009 (Scroll Sync)**
- Preview follows editor headings within ±1 viewport
- Blocks (code/tables) not severely misaligned

---

## 6. Issue/PR Templates
**.github/ISSUE_TEMPLATE.md**
```
### Type
- [ ] feat
- [ ] fix
- [ ] chore

### Summary

### Motivation / Context

### Definition of Done (DoD)
- [ ] 
- [ ] 

### References
- 
```

**.github/PULL_REQUEST_TEMPLATE.md**
```
## Summary

## Changes
- 

## Verification
- [ ] `npm run dev` works
- [ ] Screenshots or video of feature

## Related Issue
- Closes #
```

---

## 7. Claude Code Prompts (Examples)
- **Setup**: “Initialize Vite + React‑TS, add ESLint/Prettier, set up GitHub Actions CI for lint/typecheck.”
- **Split Pane**: “Implement SplitPane.tsx for resizable left=Preview, right=Editor, integrated into App.tsx.”
- **Markdown Pipeline**: “Implement useMarkdown hook with react‑markdown + remark‑gfm + rehype‑highlight + DOMPurify. Input string → safe HTML.”
- **Scroll Sync**: “Implement useScrollSync to map CodeMirror cursor to nearest heading and scroll Preview accordingly.”
- **File I/O**: “Implement file.ts wrapping Tauri fs/dialog for New/Open/Save, connect to Toolbar.”

---

## 8. Risks & Mitigations
- **Large Markdown**: debounce, diff rendering, virtualization
- **Highlight Slowness**: avoid auto language detection, encourage explicit language, lazy load highlighters
- **Markdoc Compatibility**: phased introduction, fallback to Markdown parser

---

## 9. General DoD (Definition of Done)
- Manual/automated test passes, README updated
- CI green (lint/typecheck/test)
- Layout correct in Tauri WebView
- Errors recoverable (toast/retry)

---

Use this `CLAUDE.MD` to create issues → implement small PRs. Start with **MVP‑001 to MVP‑004** in order.

