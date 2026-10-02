import { initBuilder } from './builder.js';
import { initOrder } from './order.js';
import { BEADS_BY_ID, DEFAULT_DESIGN } from './beads.js';
const NS = 'http://www.w3.org/2000/svg';
const group = document.getElementById('diagram-beads');
let api;
function svgElement(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}
// An intentionally flat pattern diagram, with the same catalog colors and slot
// order as the text summary. Never presented as a photo or a material rendering.
const shapes = Array.from({ length: 18 }, (_, i) => {
  const angle = i / 18 * Math.PI * 2 - Math.PI / 2;
  const bead = svgElement('circle', { cx: 300 + Math.cos(angle) * 190,
    cy: 250 + Math.sin(angle) * 175, r: 25, class: 'diagram-bead' });
  bead.addEventListener('click', () => api.selectSlot(i));
  group.append(bead);
  return bead;
});
const diagram = {
  setDesign(slots) {
    slots.forEach((id, i) => {
      const bead = BEADS_BY_ID[id];
      shapes[i].setAttribute('fill', bead?.color || '#e9e4d9');
      shapes[i].setAttribute('stroke-dasharray', bead ? 'none' : '3 3');
      shapes[i].setAttribute('aria-label', `Bead ${i + 1}: ${bead?.name || 'empty'}`);
    });
  },
  setSelectedSlot(slot) {
    shapes.forEach((shape, i) => shape.classList.toggle('is-selected', i === slot));
  },
};
api = initBuilder(diagram);
initOrder();
import { createPresentation } from './presentation.js';
window.presentation = createPresentation();
if (new URLSearchParams(location.search).has('measure')) import('./performance-probe.js');
