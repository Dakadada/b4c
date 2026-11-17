import assert from 'node:assert/strict';

// Minimal DOM: enough for the store and the order form, no browser needed.
class Element {
  constructor() { this.handlers = {}; this.value = ''; this.textContent = ''; this.checked = false; this.hidden = false; this.open = false; }
  addEventListener(type, fn) { this.handlers[type] = fn; }
  appendChild(el) { return el; }
  select() {}
  remove() {}
  async fire(type) { await this.handlers[type]?.({}); }
}
const ids = ['order-qty', 'order-name', 'order-note-toggle', 'order-note', 'order-note-field', 'order-summary', 'order-total', 'order-gives', 'order-details', 'btn-copy', 'btn-copy-label', 'btn-dm', 'qty-minus', 'qty-plus', 'copy-status'];
const el = Object.fromEntries(ids.map((id) => [id, new Element()]));
el['order-qty'].value = '1';
const noteEvents = [];
globalThis.document = {
  getElementById: (id) => el[id],
  createElement: () => new Element(),
  body: new Element(),
  execCommand: () => false,
  dispatchEvent: (event) => noteEvents.push(event.detail),
};
Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async (text) => { globalThis.copied = text; } } }, configurable: true });

const { BEADS, CATEGORIES, SLOT_COUNT, DEFAULT_DESIGN } = await import('../shared/beads.js');
const store = await import('../shared/store.js');
const { initOrder, INSTAGRAM_HANDLE } = await import('../shared/order.js');

// ── Catalog ──────────────────────────────────────────────────────────────────
assert.equal(BEADS.length, 24);
assert.equal(CATEGORIES.length, 4);
CATEGORIES.forEach((category) => assert.equal(BEADS.filter((bead) => bead.category === category.id).length, 6));
assert.equal(new Set(BEADS.map((bead) => bead.id)).size, 24);
assert.equal(SLOT_COUNT, 18);
assert.equal(DEFAULT_DESIGN.length, 18);

// ── Design store ─────────────────────────────────────────────────────────────
const events = [];
store.subscribe((state, event) => events.push(event.type));
assert.deepEqual(events, ['init']);
assert.deepEqual(store.getState().slots, DEFAULT_DESIGN);
store.place('garnet');
assert.equal(store.getState().slots[0], 'garnet');
assert.equal(store.getState().cursor, 1, 'placing advances to the next slot');
store.setCursor(17);
store.place('fern');
assert.equal(store.getState().slots[17], 'fern');
assert.equal(store.getState().cursor, 0, 'the cursor wraps around the bracelet');
store.stepCursor(-1);
assert.equal(store.getState().cursor, 17, 'stepping back from the first slot wraps');
store.clear();
assert.equal(store.filledCount(), 0);
assert.equal(store.getState().cursor, 0);
store.shuffle();
assert.equal(store.getState().slots.length, 18);
assert.ok(store.getState().slots.every((id) => BEADS.some((bead) => bead.id === id)));
store.setDesign(Array(18).fill('peacock'));
assert.ok(store.getState().slots.every((id) => id === 'peacock'));
assert.ok(events.includes('place') && events.includes('cursor') && events.includes('reset'));

// ── Order summary ────────────────────────────────────────────────────────────
initOrder();
assert.equal(el['order-total'].textContent, '$4.99');
assert.equal(el['btn-dm'].href, `https://ig.me/m/${INSTAGRAM_HANDLE}`);
assert.match(el['order-summary'].textContent, /Design \(18 of 18 beads\)/);
assert.match(el['order-summary'].textContent, /Kaleidoscopic: 18× Peacock/);
store.setCursor(0);
store.place('gold');
assert.match(el['order-summary'].textContent, /Slot order: 1: Gold, 2: Peacock/, 'the summary follows the design');
store.clear();
assert.match(el['order-summary'].textContent, /no beads yet/);
assert.match(el['order-summary'].textContent, /1: empty/);

el['order-qty'].value = '99';
await el['order-qty'].fire('change');
assert.equal(el['order-qty'].value, 10, 'quantity is capped at ten');
assert.equal(el['order-total'].textContent, '$49.90');
assert.match(el['order-gives'].textContent, /10 bracelets and 10 handwritten notes/);
el['order-qty'].value = '-2';
await el['order-qty'].fire('change');
assert.equal(el['order-total'].textContent, '$4.99');
await el['qty-plus'].fire('click');
assert.equal(el['order-total'].textContent, '$9.98');
await el['qty-minus'].fire('click');
await el['qty-minus'].fire('click');
assert.equal(el['order-total'].textContent, '$4.99', 'quantity never drops below one');
assert.match(el['order-gives'].textContent, /1 bracelet and 1 handwritten note to/);

el['order-name'].value = '  Sam  ';
await el['order-name'].fire('input');
assert.match(el['order-summary'].textContent, /Name: Sam\n/);
el['order-note'].value = 'You matter.';
await el['order-note'].fire('input');
assert.ok(!el['order-summary'].textContent.includes('You matter.'), 'note words stay out until the box is ticked');
assert.equal(el['order-note-field'].hidden, true);
el['order-note-toggle'].checked = true;
await el['order-note-toggle'].fire('change');
assert.equal(el['order-note-field'].hidden, false);
assert.ok(el['order-summary'].textContent.includes('Words for the note: “You matter.”'));
assert.equal(noteEvents.at(-1), 'You matter.', 'the note card on the page is told the words');

await el['btn-copy'].fire('click');
assert.equal(globalThis.copied, el['order-summary'].textContent);
assert.match(el['btn-copy-label'].textContent, /Copied/);
navigator.clipboard.writeText = async () => { throw Error('Denied'); };
await el['btn-copy'].fire('click');
assert.equal(el['order-details'].open, true, 'a blocked copy opens the summary to copy by hand');
assert.match(el['copy-status'].textContent, /Copy is blocked/);

console.log('PASS: 24 beads in 4 finishes, 18 slots, place/cursor wrap/clear/shuffle/setDesign, summary follows design, quantity 1 to 10, totals, name, note opt-in, clipboard success and failure, Instagram link.');
process.exit(0);
