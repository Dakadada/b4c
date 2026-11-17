import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Source contracts for the main site (root index.html, served from next/). Not visual acceptance.
const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (file) => fs.readFile(path.join(root, file), 'utf8');
const exists = (file) => fs.access(path.join(root, file));
const local = (ref) => !/^(https?:|data:|mailto:|#)/.test(ref);

const pages = { 'index.html': await read('index.html'), 'team.html': await read('team.html'), 'legal.html': await read('legal.html') };
const idsOf = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const indexIds = idsOf(pages['index.html']);

let refs = 0;
for (const [name, html] of Object.entries(pages)) {
  assert.ok(!/©|copyright/i.test(html), `${name} carries no copyright notice`);
  assert.match(html, /<meta name="viewport" content="width=device-width,initial-scale=1">/);
  assert.equal([...html.matchAll(/<h1[\s>]/g)].length, 1, `${name} has exactly one h1`);
  assert.match(html, /href="next\/one-pull\/style\.css"/, `${name} uses the main stylesheet`);
  for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (!local(ref)) continue;
    const [file, hash] = ref.split('#');
    await exists(file.split('?')[0]);
    refs++;
    if (hash && file === 'index.html') assert.ok(indexIds.has(hash), `${name} links to #${hash}, which exists on the main page`);
  }
  for (const [, hash] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(idsOf(html).has(hash), `${name} #${hash} resolves`);
  for (const [tag] of html.matchAll(/<button\b[^>]*>/g)) assert.match(tag, /type="button"/, `${name}: ${tag} declares its type`);
}

const index = pages['index.html'];
assert.match(index, /"three":"https:\/\/cdn\.jsdelivr\.net\/npm\/three@\d+\.\d+\.\d+\/build\/three\.module\.js"/, 'three.js is pinned to an exact version');
assert.match(index, /src="next\/one-pull\/page\.js"/);
// Every element the scripts look up by id is on the page.
const scripts = ['next/one-pull/page.js', 'next/shared/page.js', 'next/shared/order.js'];
let lookups = 0;
for (const file of scripts) {
  const source = await read(file);
  for (const [, id] of source.matchAll(/(?:getElementById|\$)\('([^']+)'\)/g)) {
    assert.ok(indexIds.has(id), `${file} looks up #${id}, which is on the page`);
    lookups++;
  }
}
// The three steps, the tally, and the order form all carry a live preview of the design.
assert.ok([...index.matchAll(/data-mini/g)].length >= 6);
assert.match(index, /650 bracelets given since fall 2025/);
assert.match(index, /\$4\.99/);

// Every relative import between modules resolves.
let imports = 0;
for (const dir of ['next/one-pull', 'next/bead-box', 'next/shared']) {
  for (const file of (await fs.readdir(path.join(root, dir))).filter((name) => name.endsWith('.js'))) {
    const source = await read(`${dir}/${file}`);
    for (const [, spec] of source.matchAll(/(?:from|import\()\s*'(\.[^']+)'/g)) {
      await exists(path.join(dir, spec));
      imports++;
    }
  }
}

// No type on the main site is set below 13px.
const css = await read('next/one-pull/style.css');
const sizes = [...css.matchAll(/font(?:-size)?:[^;{}]*?(\d*\.?\d+)rem/g)].map((m) => Number(m[1]));
assert.ok(sizes.length > 30);
assert.ok(Math.min(...sizes) * 16 >= 13, `smallest font size is ${Math.min(...sizes) * 16}px`);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /\.swatch-name \{ min-height: 2\.3em;/, 'bead names reserve two lines so no finish moves the tray');

console.log(`PASS: 3 pages, ${refs} local references exist, anchors resolve, ${lookups} id lookups present, ${imports} module imports resolve, three.js pinned, smallest type ${Math.min(...sizes) * 16}px. (Source contracts, not visual acceptance.)`);
