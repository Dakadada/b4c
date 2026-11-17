import { BEADS_BY_ID } from './beads.js';
import { subscribe } from './store.js';

// Small DOM previews of the current design, shaded in CSS (.mb). They exist so
// the visitor's own bracelet follows them down the page without a third canvas.
function fill(el, slots) {
  if (el.children.length !== slots.length) {
    el.replaceChildren(...slots.map((_, i) => {
      const bead = document.createElement('span');
      bead.className = 'mb';
      bead.style.setProperty('--i', i);
      return bead;
    }));
  }
  slots.forEach((id, i) => {
    const bead = BEADS_BY_ID[id];
    const node = el.children[i];
    node.style.setProperty('--c', bead?.color || 'transparent');
    node.dataset.cat = bead?.category || 'empty';
  });
}

export function bindMinis() {
  const targets = [...document.querySelectorAll('[data-mini]')];
  targets.forEach((el) => el.setAttribute('aria-hidden', 'true'));
  subscribe((state) => targets.forEach((el) => fill(el, state.slots)));
}
