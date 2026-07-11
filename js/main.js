import { BraceletScene } from './bracelet-scene.js';
import { initBuilder } from './builder.js';
import { initOrder } from './order.js';
import { DEFAULT_DESIGN } from './beads.js';
import {
  initSmoothScroll,
  initCord,
  initHero,
  initHowItWorks,
  initImpact,
  initReveals,
} from './scrollytelling.js';

// The 3D scenes are an enhancement: if WebGL is unavailable the rest of the
// page (builder palette, order flow, scrollytelling) must still work.
function tryScene(container, options) {
  try {
    return new BraceletScene(container, options);
  } catch (err) {
    console.warn('WebGL unavailable — bracelet preview disabled.', err);
    container.classList.add('no-webgl');
    return { setDesign() {}, setSelectedSlot() {} };
  }
}

// Ambient bracelet behind the hero headline.
const heroScene = tryScene(document.getElementById('hero-canvas'));
heroScene.setDesign(DEFAULT_DESIGN);

// Interactive builder bracelet.
let builderApi;
const builderScene = tryScene(document.getElementById('builder-canvas'), {
  interactive: true,
  onBeadClick: (slot) => builderApi.selectSlot(slot),
});
builderApi = initBuilder(builderScene);

initOrder();

initSmoothScroll();
initHero();
initHowItWorks();
initImpact();
initReveals();
// The cord measures section positions, so it must come after the pinned
// sections have inserted their spacers.
initCord();

document.getElementById('year').textContent = new Date().getFullYear();
