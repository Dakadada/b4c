import { BEADS, DEFAULT_DESIGN, SLOT_COUNT } from './beads.js';

// One design, shared by every view on the page: the 3D bracelets, the DOM
// previews, and the order summary. `cursor` is the slot the next bead lands in.
const state = { slots: DEFAULT_DESIGN.slice(), cursor: 0 };

const listeners = [];
export function subscribe(fn) {
  listeners.push(fn);
  fn(state, { type: 'init' });
  return () => { const index = listeners.indexOf(fn); if (index !== -1) listeners.splice(index, 1); };
}
function notify(event) {
  listeners.forEach((fn) => fn(state, event));
}
export function getState() {
  return state;
}

export function place(beadId) {
  const slot = state.cursor;
  state.slots[slot] = beadId;
  // Advance around the ring so a run of taps paints a sequence.
  state.cursor = (slot + 1) % SLOT_COUNT;
  notify({ type: 'place', slot, beadId });
}

export function setCursor(index) {
  state.cursor = ((index % SLOT_COUNT) + SLOT_COUNT) % SLOT_COUNT;
  notify({ type: 'cursor' });
}

export function stepCursor(delta) {
  setCursor(state.cursor + delta);
}

// A page may open on its own starting design.
export function setDesign(slots) {
  state.slots = slots.slice(0, SLOT_COUNT);
  state.cursor = 0;
  notify({ type: 'reset' });
}

export function shuffle() {
  state.slots = Array.from({ length: SLOT_COUNT }, () => BEADS[Math.floor(Math.random() * BEADS.length)].id);
  state.cursor = 0;
  notify({ type: 'reset' });
}

export function clear() {
  state.slots = Array(SLOT_COUNT).fill(null);
  state.cursor = 0;
  notify({ type: 'reset' });
}

export function filledCount() {
  return state.slots.filter(Boolean).length;
}
