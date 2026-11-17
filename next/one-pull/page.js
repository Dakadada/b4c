import { initPage, webglAvailable } from '../shared/page.js';
import { BEADS, CATEGORIES } from '../shared/beads.js';
import { place, setDesign } from '../shared/store.js';

// This page opens on a design with no metal in it, so the gold cord is the only gold on the cloth.
const OPENING = ['garnet', 'ivory-pearl', 'peacock', 'ivory-pearl', 'cornflower', 'ivory-pearl'];
setDesign(Array.from({ length: 18 }, (_, i) => OPENING[i % OPENING.length]));

initPage();

// The bead tray: four finishes, six beads each. Tapping one puts it in the current slot.
const tabsEl = document.getElementById('palette-tabs');
const gridEl = document.getElementById('palette-grid');
let active = CATEGORIES[0].id;
const tabs = CATEGORIES.map((category) => {
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.textContent = category.label;
  tab.addEventListener('click', () => { active = category.id; renderTray(); });
  tabsEl.append(tab);
  return { tab, id: category.id };
});
function renderTray() {
  tabs.forEach(({ tab, id }) => tab.setAttribute('aria-pressed', String(id === active)));
  gridEl.replaceChildren(...BEADS.filter((bead) => bead.category === active).map((bead) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Use a ${bead.name} bead`);
    const swatch = document.createElement('span');
    swatch.className = 'mb';
    swatch.style.setProperty('--c', bead.color);
    swatch.dataset.cat = bead.category;
    const name = document.createElement('span');
    name.className = 'swatch-name';
    name.textContent = bead.name;
    button.append(swatch, name);
    button.addEventListener('click', () => place(bead.id));
    return button;
  }));
}
renderTray();

// No WebGL, or the 3D library failed to load: two CSS bracelets stand in for the cord.
const flat = () => document.documentElement.classList.add('no-webgl');

if (webglAvailable()) {
  Promise.all([import('./scene.js'), import('../shared/ledger.js')]).then(([scene, ledger]) => {
    scene.initOnePull({
      canvas: document.getElementById('stage'),
      rigEl: document.getElementById('rig-zone'),
      handle: document.getElementById('pull'),
      handleLabel: document.getElementById('pull-label'),
      tagKept: document.getElementById('tag-kept'),
      tagGiven: document.getElementById('tag-given'),
    });
    ledger.initLedger(document.getElementById('ledger'), { motion: 'draw', envFloor: 0x1c1d21, floorOpacity: 0.6 });
  }).catch((error) => { console.error(error); flat(); });
} else {
  flat();
}
