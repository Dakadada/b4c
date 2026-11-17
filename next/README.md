# Brace4Change — main site

`/index.html` at the repository root is the main page ("One Pull"). Its code is here:

- `one-pull/` — the page's stylesheet, page script, and the three.js scene (the cord, the pull, the two bracelets).
- `shared/` — bead catalog, the design store, order summary, the 650-ring ledger, the team roster, and the small 3D kit both variants use.
- `bead-box/` — an alternate design, kept ready to swap in. Open `next/bead-box/index.html` to see it; it is not linked from the site.
  To make it the main page, copy that file to the root `index.html` and prefix its `style.css`, `page.js`, `team.html` and `legal.html` paths the way the current root page does.
- `tests/` — `npm test --prefix next` (store, order summary, and source contracts for the three root pages).

No build step. three.js loads from jsDelivr through the import map in `index.html`. Without WebGL the page falls back to CSS bracelets and still takes orders.
