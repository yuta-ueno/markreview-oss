# MarkReview 0.1.8 (2025-09-07)

Highlights
- Fix: Prevent duplicate success toasts on file drop in Tauri. Also adds short‑window toast deduplication to avoid accidental duplicates across code paths.
- Dev UX: Adds `npm run status` / `status:health` to summarize repo state and run quick health checks. AGENTS.md now starts with a “Session Resume (High Priority)” section.
- Docs: README updated to reflect the unified/remark/rehype pipeline, theme set, settings storage locations, and contributor quick‑start.

Changes (since v0.1.7)
- fix: prevent duplicate toasts on file drop (Tauri) and add toast deduplication
- docs: add 'Session Resume (High Priority)' to AGENTS.md with status scripts
- docs: update README to reflect unified/rehype pipeline, themes, settings storage, and contributor status flow

Quality
- Tests (Vitest): 17 passing
- Typecheck/ESLint: clean

Assets
- Windows MSI installer (x64)
- Windows NSIS setup (x64)

