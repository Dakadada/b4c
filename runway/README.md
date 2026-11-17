# Brace4Change — camera preview (previous main site)

The main site is no longer served from this folder. The repository root (`/`, `/team.html`, `/legal.html`) now serves the "One Pull" site, whose code lives in `next/one-pull/` and `next/shared/` (tests: `npm test --prefix next`).

This folder keeps the earlier cinematic camera version, still reachable at `/runway/` with its own modules, styles and artwork. Run `npm test --prefix runway` for its contracts. See `verification/ACCEPTANCE.md` for the browser evidence recorded for that version. `window.presentation` exposes `setProgress`, `setPaused`, `refresh` and `destroy`; chapters include prologue, opening, making, impact and handoff.
