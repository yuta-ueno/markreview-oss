# MarkReview 0.1.11 — 2025-09-07

Focus: Scroll sync robustness, XSS hardening, telemetry verification, tests

## Highlights
- Scroll sync is now robust across Web and Tauri desktop:
  - Added MutationObserver-based rebinding when `.cm-scroller`/`.preview-content` appear or change
  - New `useScrollSync` API allows passing `editorEl`/`previewEl` directly (backward-compatible)
- XSS hardening:
  - Centralized sanitizer `sanitizeHtml` used by Preview and VirtualizedPreview
  - Added tests for `<script>`, `javascript:` URLs, and event attributes
- No-telemetry guardrails strengthened:
  - `verify:no-telemetry` checks CSP/capabilities for Tauri 2 and code for network/analytics
- Tests moved into `src/` to run in CI

## Changes
- feat(scroll): `useScrollSync` accepts `editorEl`/`previewEl`; rebind listeners when DOM changes
- fix(scroll): Tauri-specific async creation handled via observers and App-side fallback
- refactor(sanitize): unify DOMPurify config in `src/utils/sanitizeHtml.ts`
- test(sanitization): add unit tests for common XSS vectors
- chore(ci): run typecheck, unit tests, verify:no-telemetry in CI
- docs: update refactoring analysis and add this release note

## Notes
- CSP keeps `connect-src 'self' ipc:`; no outbound HTTP is permitted.
- Very large documents use virtualized preview; performance depends on content structure.

