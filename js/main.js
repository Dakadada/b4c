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

// A failed CDN/module load must not take the order form down with WebGL.
let BraceletScene;
try {
  ({ BraceletScene } = await import('./bracelet-scene.js'));
} catch (error) {
  console.warn('3D preview could not load; using the static campaign image.', error);
}

// The 3D scenes are an enhancement: if WebGL is unavailable the rest of the
// page (builder palette, order flow, scrollytelling) must still work.
function tryScene(container, options) {
  try {
    return new BraceletScene(container, options);
  } catch (err) {
    console.warn('WebGL unavailable — bracelet preview disabled.', err);
    container.classList.add('no-webgl');
    container.querySelector('canvas')?.remove();
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

if (window.gsap && window.ScrollTrigger) {
  initSmoothScroll();
  initHero();
  initHowItWorks();
  initImpact();
  initReveals();
// The cord measures section positions, so it must come after the pinned
// sections have inserted their spacers.
initCord();
} else {
  document.getElementById('how-pin').classList.add('how-static');
  initImpact(true);
}

const motionToggle = document.getElementById('motion-toggle');
motionToggle?.addEventListener('click', () => {
  const paused = motionToggle.getAttribute('aria-pressed') !== 'true';
  motionToggle.setAttribute('aria-pressed', String(paused));
  motionToggle.textContent = paused ? 'Resume ambient motion' : 'Pause ambient motion';
  document.documentElement.classList.toggle('motion-paused', paused);
  document.dispatchEvent(new CustomEvent('campaign-motion', { detail: { paused } }));
});

document.getElementById('year').textContent = new Date().getFullYear();
