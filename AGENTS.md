# Repository Guidelines

# Repository Guidelines

## Session Resume (High Priority)
- Always start by running `npm run status` to summarize branch, recent commits, working tree changes, untracked files, area breakdown (components/hooks/styles/tauri/config/tests), and diff since last tag.
- For a quick health check, run `npm run status:health` to execute TypeScript typecheck and `vitest run`.
- If telemetry settings are relevant, run `npm run verify:no-telemetry` and address any failures before continuing.
- Prefer `rg` (ripgrep) for code search when available, e.g., `rg -n "TODO|FIXME|HACK|@todo" -S`.

## Project Structure & Module Organization
- `src/` React + TypeScript app: `components/` (UI, PascalCase, e.g., `Toolbar.tsx`), `hooks/` (custom hooks, `use*.ts`), `utils/`, `styles/`, `assets/`.
- Tests live near code: e.g., `src/hooks/__tests__/useMarkdown.test.ts`.
- `src-tauri/` Tauri 2.x (Rust) desktop shell and packaging.
- Config: `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `tsconfig*.json`. Static files in `public/`.

## Build, Test, and Development Commands
- `npm run dev` — Vite dev server (web preview).
- `npm run tauri:dev` — Desktop app with hot reload.
- `npm run build` — Type-check + Vite production build.
- `npm run tauri:build` — Package desktop binaries.
- `npm test` / `npm run test:run` — Run Vitest (jsdom).
- `npm run lint` / `npm run format` — ESLint (fix) / Prettier.
- `npm run typecheck` — TypeScript `--noEmit`.
- `npm run verify:no-telemetry` — Guardrail to keep telemetry disabled.

## Coding Style & Naming Conventions
- Prettier: 2 spaces, `singleQuote: true`, `semi: false`, `printWidth: 80`.
- TypeScript strict mode; prefer explicit types at public boundaries.
- Components: PascalCase (`SplitPane.tsx`). Hooks: `useX.ts`. Utilities: camelCase.
- Avoid disabling ESLint rules; if needed, scope narrowly with rationale.

## Testing Guidelines
- Frameworks: Vitest + Testing Library (`environment: 'jsdom'`, setup in `src/test/setup.ts`).
- Naming: `*.test.ts[x]` under `__tests__` or alongside modules.
- Cover hooks and non-trivial components. Example: `renderHook(() => useMarkdown('# Title'))` and assert sanitized HTML.
- Run `npm test` locally; ensure CI passes before opening PRs.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `release:` (see git history for examples).
- PRs must include: clear description, linked issues (`Closes #123`), screenshots/GIFs for UI changes, and evidence of `lint`, `typecheck`, `test` passing.

## Security & Configuration Tips
- Tauri: don’t widen capabilities/plugins without review; keep filesystem scopes minimal.
- Keep sanitization (`dompurify`) intact; avoid `dangerouslySetInnerHTML` unless sanitized.
- No telemetry policy: run `npm run verify:no-telemetry`.
