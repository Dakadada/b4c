import { initBuilder } from './builder.js';
import { initOrder } from './order.js';
import { DEFAULT_DESIGN } from './beads.js';
import { initSmoothScroll, initImpact, initChoreography } from './scrollytelling.js';

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

initImpact();
if (window.gsap && window.ScrollTrigger) {
  initSmoothScroll();
  initChoreography();
} else {
  document.getElementById('motion-toggle').hidden = true;
}

document.getElementById('year').textContent = new Date().getFullYear();
