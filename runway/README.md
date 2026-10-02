# Brace4Change — main site

The camera version is now served at the repository root (`/`, `/index.html`, `/team.html`, `/legal.html`). Root pages load the same modules, styles and artwork in `runway/`; `/runway/` remains available with identical presentation and builder behavior. No deployment or commit was made. Copyright notices have been removed from every page.

Run `npm test --prefix runway`. See `verification/ACCEPTANCE.md` for browser evidence and the outstanding physical iPhone performance checks. `window.presentation` exposes `setProgress`, `setPaused`, `refresh` and `destroy`; chapters include prologue, opening, making, impact and handoff. Native scrolling and readable fallback flow are retained.
