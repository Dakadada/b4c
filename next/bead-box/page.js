import { initPage, webglAvailable } from '../shared/page.js';
import { BEADS } from '../shared/beads.js';
import { place } from '../shared/store.js';

initPage();

const hoverName = document.getElementById('hover-name');
const onHover = (bead) => {
  hoverName.textContent = bead ? `${bead.name}, ${bead.category}` : 'Tap a bead in the box.';
};

// No WebGL, or the 3D library failed to load: the box becomes a flat grid of
// the same twenty-four beads and the bracelets become CSS rings.
function flatBox() {
  document.documentElement.classList.add('no-webgl');
  const zone = document.getElementById('tray-zone');
  BEADS.forEach((bead) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cell-flat';
    button.setAttribute('aria-label', `Add a ${bead.name} bead`);
    const swatch = document.createElement('span');
    swatch.className = 'mb';
    swatch.style.setProperty('--c', bead.color);
    swatch.dataset.cat = bead.category;
    button.append(swatch);
    button.addEventListener('click', () => place(bead.id));
    zone.append(button);
  });
}

if (webglAvailable()) {
  Promise.all([import('./scene.js'), import('../shared/ledger.js')]).then(([scene, ledger]) => {
    scene.initBeadBox({
      canvas: document.getElementById('stage'),
      trayEl: document.getElementById('tray-zone'),
      keptEl: document.getElementById('kept-zone'),
      givenEl: document.getElementById('given-zone'),
      hitLayer: document.getElementById('hits'),
      onHover,
    });
    ledger.initLedger(document.getElementById('ledger'), { motion: 'drop', envFloor: 0xff5d8f, floorOpacity: 0.3 });
  }).catch((error) => { console.error(error); flatBox(); });
} else {
  flatBox();
}
