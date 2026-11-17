# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: static HTML/CSS/JS with three.js for real-time 3D, no build step, deployed as static files on Vercel (`vercel.json` serves the repository root). Chosen because the existing site is already buildless static and the user asked for "3.js or whatever is best".

## Users

Two audiences in roughly equal measure (confirmed 2026-11-16):

- Classmates and friends arriving from the Instagram bio link, on phones.
- Parents, teachers, and local supporters, often on laptops, deciding whether to back the project.

Their job on the site: understand the give-one promise, design a bracelet, and carry the order into an Instagram DM.

## Product Purpose

Brace4Change sells handmade beaded bracelets for $4.99. For every bracelet bought, the team strings an identical twin and delivers it with a handwritten note to a nursing home or shelter in the Des Moines area. Success is a visitor finishing a design and sending the order summary by Instagram DM.

## Positioning

Every order is made twice: the buyer's own design, bead for bead, ends up on a stranger's wrist with a handwritten note. The donated item is the buyer's design, not a generic gift.

## Operating Context

- Ordering, payment, and pickup or delivery are arranged over Instagram DM with `@brace4change.official`. The site has no cart, no payment, no accounts, no analytics, and no cookies.
- The builder runs entirely in the browser. A design leaves the device only when the visitor copies the order summary and sends it.
- A bracelet has 18 bead slots. The catalog has 24 beads in four finishes: metallic, pearly, kaleidoscopic, solid (`runway/js/beads.js`).
- Buyers may add their own words (up to 240 characters) to the handwritten note; only those words travel with the donated bracelet.

## Capabilities and Constraints

- Price is $4.99 per bracelet; quantity 1 to 10 per order summary.
- Brace4Change is a volunteer community initiative, not a registered 501(c)(3); purchases are not tax-deductible.
- The builder preview is a guide, not a photograph; beads vary by batch.
- Recipients and timing of donated bracelets are chosen by the team.
- No real photographs on the site (user constraint, 2026-11-16).
- Existing pages besides the main page: `team.html`, `legal.html`.

## Brand Commitments

- Name: Brace4Change. Tagline in use: "Wear one. Give one." Recurring line: "One kept, one given."
- Handmade in Des Moines, Iowa.
- Instagram handle: `@brace4change.official`.

## Evidence on Hand

- 650 bracelets given away, 650 sold, 650 notes written by hand, since fall 2025. Confirmed real by the user on 2026-11-16.
- Bead catalog with names, colors, and material recipes: `runway/js/beads.js`.
- Team roster in `runway/js/team.js` is marked in code as placeholder people; treat as unconfirmed.
- No testimonials, press, partner names, or recipient stories exist. Do not fabricate them.

## Product Principles

- The twin is the product. Anything that shows one bracelet should make the second one felt.
- Say what happens plainly: who makes it, where it goes, what it costs.
- The visitor's own design is the proof. Let them make something before asking them to believe something.
- Small and local is a strength, not something to dress up.
