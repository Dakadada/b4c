import { initOrder } from './order.js';
import { bindMinis } from './mini.js';
import { subscribe, stepCursor, shuffle, clear } from './store.js';
import { SLOT_COUNT } from './beads.js';

const SAMPLE_NOTE = 'Someone across town picked these beads and is wearing the same bracelet right now. We hope it makes today a little lighter.';

export function webglAvailable() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

// Everything on the page that is not 3D: the slot stepper, the DOM previews of
// the design, the note card that mirrors the order form, and the order itself.
export function initPage() {
  const $ = (id) => document.getElementById(id);
  $('slot-prev').addEventListener('click', () => stepCursor(-1));
  $('slot-next').addEventListener('click', () => stepCursor(1));
  $('btn-shuffle').addEventListener('click', shuffle);
  $('btn-clear').addEventListener('click', clear);
  subscribe((state) => {
    $('slot-label').textContent = `Slot ${String(state.cursor + 1).padStart(2, '0')} of ${SLOT_COUNT}`;
  });

  const words = $('note-words');
  const caption = $('note-caption');
  document.addEventListener('order-note', (event) => {
    words.textContent = event.detail || SAMPLE_NOTE;
    caption.textContent = event.detail ? 'Your words, as they will travel with the twin.' : 'A sample note. Add your own words when you order.';
  });

  bindMinis();
  initOrder();
}
