import * as THREE from 'three';
import { BEADS_BY_ID, SLOT_COUNT } from './beads.js';

export { THREE };

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const ease = {
  outExpo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  inOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  inOutQuad: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
  outBack: (k) => 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2),
  // One drop, one bounce, settle.
  outBounce: (k) => {
    if (k < 0.62) return (k / 0.62) * (k / 0.62);
    const b = (k - 0.81) / 0.19;
    return 1 - 0.14 * (1 - b * b);
  },
};

// Deterministic noise so piles and grids look the same on every load.
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Large softboxes give metal and pearl long studio reflections instead of the
// pinpoint highlights of a generic room. `floor` tints what beads see below.
export function softboxEnvironment(renderer, { floor = 0x555555, back = 0x9a9ca4 } = {}) {
  const room = new THREE.Scene();
  room.background = new THREE.Color(back);
  const panels = [
    { position: [-4, 6, 3], size: [6, 6], color: 0xffffff, intensity: 9 },
    { position: [5, 4, 1], size: [1.6, 8], color: 0xfff4e6, intensity: 6 },
    { position: [0, 5, -6], size: [10, 1.6], color: 0xe6f0ff, intensity: 5 },
    { position: [2, 7, 5], size: [3, 3], color: 0xffffff, intensity: 4 },
    { position: [0, -5, 0], size: [14, 14], color: floor, intensity: 1.2 },
  ];
  panels.forEach(({ position, size, color, intensity }) => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(...size),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    panel.position.set(...position);
    panel.lookAt(0, 0, 0);
    room.add(panel);
  });
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(room, 0.03);
  generator.dispose();
  room.children.forEach((panel) => { panel.geometry.dispose(); panel.material.dispose(); });
  return target.texture;
}

// A round bead with a real cord hole through it. The hole runs along local Y.
export function beadGeometry(radius, detail = 'high') {
  const hole = radius * 0.17;
  const end = Math.acos(hole / radius);
  const steps = detail === 'high' ? 26 : 10;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const angle = -end + (2 * end * i) / steps;
    points.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  points.push(new THREE.Vector2(hole, -Math.sin(end) * radius));
  return new THREE.LatheGeometry(points, detail === 'high' ? 40 : 18);
}

const materials = new Map();
export function beadMaterial(id) {
  if (materials.has(id)) return materials.get(id);
  const bead = BEADS_BY_ID[id];
  const m = bead.mat || {};
  const material = new THREE.MeshPhysicalMaterial({
    color: bead.color,
    metalness: m.metalness ?? 0,
    roughness: m.roughness ?? 0.5,
    clearcoat: m.clearcoat ?? 0,
    clearcoatRoughness: m.clearcoatRoughness ?? 0,
    sheen: m.sheen ?? 0,
    iridescence: m.iridescence ?? 0,
    iridescenceIOR: m.iridescenceIOR ?? 1.3,
    envMapIntensity: 1.15,
  });
  if (m.iridescenceThicknessRange) material.iridescenceThicknessRange = m.iridescenceThicknessRange;
  if (m.sheen) {
    material.sheenColor = new THREE.Color(bead.color).lerp(new THREE.Color(0xffffff), 0.5);
    material.sheenRoughness = 0.4;
  }
  if (bead.category === 'metallic') material.envMapIntensity = 2.5;
  if (bead.category === 'solid') {
    // Matte candy still needs one soft highlight to read as a sphere.
    material.roughness = 0.62;
    material.clearcoat = 0.35;
    material.clearcoatRoughness = 0.5;
  }
  materials.set(id, material);
  return material;
}

const UP = new THREE.Vector3(0, 1, 0);
const tmpV = new THREE.Vector3();

// Eighteen bead meshes for one bracelet. The scene decides where they sit.
export class BeadSet {
  constructor(parent, geometry) {
    this.meshes = Array.from({ length: SLOT_COUNT }, (_, slot) => {
      const mesh = new THREE.Mesh(geometry, beadMaterial('gold'));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.slot = slot;
      mesh.visible = false;
      parent.add(mesh);
      return mesh;
    });
  }

  apply(slot, id) {
    const mesh = this.meshes[slot];
    mesh.visible = Boolean(id);
    if (id) mesh.material = beadMaterial(id);
    mesh.scale.setScalar(1);
  }

  applyAll(slots) {
    slots.forEach((id, slot) => this.apply(slot, id));
  }

  // Point the cord hole along the cord's tangent.
  orient(slot, tx, tz) {
    this.meshes[slot].quaternion.setFromUnitVectors(UP, tmpV.set(tx, 0, tz).normalize());
  }
}

export function createTweens() {
  const list = [];
  return {
    add({ duration, delay = 0, easing = ease.outExpo, update, done }) {
      const tween = { duration, delay, easing, update, done, time: 0 };
      list.push(tween);
      return tween;
    },
    step(dt) {
      for (let i = list.length - 1; i >= 0; i--) {
        const tween = list[i];
        if (tween.delay > 0) { tween.delay -= dt; continue; }
        tween.time += dt;
        const k = clamp01(tween.time / tween.duration);
        tween.update(tween.easing(k), k);
        if (k >= 1) { list.splice(i, 1); tween.done?.(); }
      }
    },
  };
}

/**
 * A canvas, a camera looking down at a tabletop, and a render loop that only
 * runs while the canvas is on screen and the tab is visible. Objects are laid
 * out against DOM rectangles with `fit`, so the 3D follows the page's layout
 * at every breakpoint instead of the page being arranged around the 3D.
 */
export function createStage(canvas, { fov = 30, eye = [0, 14.5, 9.6], look = [0, 0, 0.2], alpha = true, dprCap = 2 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.5, 120);
  camera.position.set(...eye);
  camera.lookAt(...look);

  const frameFns = [];
  const layoutFns = [];
  const raycaster = new THREE.Raycaster();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ndc = new THREE.Vector2();
  let width = 1;
  let height = 1;
  let visible = false;
  let running = false;
  let last = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    width = rect.width;
    height = rect.height;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    layoutFns.forEach((fn) => fn(width, height));
    if (!running) renderer.render(scene, camera);
  }

  function screenToGround(x, y, target = new THREE.Vector3()) {
    ndc.set((x / width) * 2 - 1, -((y / height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(ground, target) || target.set(0, 0, 0);
  }

  function worldToScreen(world) {
    const p = tmpV.copy(world).project(camera);
    return { x: ((p.x + 1) / 2) * width, y: ((1 - p.y) / 2) * height };
  }

  // Rectangle of a DOM element in canvas pixels.
  function rectOf(el) {
    const a = el.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();
    return { left: a.left - c.left, top: a.top - c.top, width: a.width, height: a.height, cx: a.left - c.left + a.width / 2, cy: a.top - c.top + a.height / 2 };
  }

  // Centre a group on a DOM rectangle and scale its footprint (w across, d deep, centred on
  // the group's origin) until its projection just fits inside. Measured on screen and refined,
  // so the camera's tilt and perspective are accounted for. Returns the scale it settled on.
  const fitA = new THREE.Vector3();
  const fitB = new THREE.Vector3();
  const fitCorner = new THREE.Vector3();
  function fit(group, el, w, d) {
    const r = rectOf(el);
    screenToGround(r.cx, r.cy, fitA);
    group.position.set(fitA.x, 0, fitA.z);
    group.scale.setScalar(1);
    for (let pass = 0; pass < 4; pass++) {
      group.updateMatrixWorld(true);
      let left = Infinity; let top = Infinity; let right = -Infinity; let bottom = -Infinity;
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
        const p = worldToScreen(group.localToWorld(fitCorner.set((sx * w) / 2, 0, (sz * d) / 2)));
        left = Math.min(left, p.x); right = Math.max(right, p.x); top = Math.min(top, p.y); bottom = Math.max(bottom, p.y);
      });
      group.scale.multiplyScalar(Math.min(r.width / (right - left), r.height / (bottom - top)));
      screenToGround((left + right) / 2, (top + bottom) / 2, fitA);
      screenToGround(r.cx, r.cy, fitB);
      group.position.x += fitB.x - fitA.x;
      group.position.z += fitB.z - fitA.z;
    }
    group.updateMatrixWorld(true);
    return group.scale.x;
  }

  function pick(clientX, clientY, objects) {
    const c = canvas.getBoundingClientRect();
    ndc.set(((clientX - c.left) / width) * 2 - 1, -(((clientY - c.top) / height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(objects, false)[0] || null;
  }

  function tick(now) {
    running = visible && !document.hidden;
    if (!running) return;
    const t = now / 1000;
    const dt = Math.min(0.05, last ? t - last : 0.016);
    last = t;
    frameFns.forEach((fn) => fn(t, dt));
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  function wake() {
    if (!running && visible && !document.hidden) { running = true; last = 0; requestAnimationFrame(tick); }
  }

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); }, { rootMargin: '120px' }).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener('visibilitychange', wake);

  return {
    renderer, scene, camera, screenToGround, worldToScreen, rectOf, fit, pick, resize,
    get width() { return width; },
    get height() { return height; },
    onFrame: (fn) => frameFns.push(fn),
    onLayout: (fn) => layoutFns.push(fn),
  };
}

// Sun-like key light whose shadow frustum is sized to the content it covers.
export function keyLight(scene, { position = [-9, 10, 4], intensity = 1.7, mapSize = 2048 } = {}) {
  const light = new THREE.DirectionalLight(0xffffff, intensity);
  light.position.set(...position);
  light.castShadow = true;
  light.shadow.mapSize.set(mapSize, mapSize);
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.03;
  light.shadow.radius = 5;
  scene.add(light, light.target);
  const box = new THREE.Box3();
  const sphere = new THREE.Sphere();
  const offset = new THREE.Vector3(...position);
  light.cover = (...objects) => {
    box.makeEmpty();
    objects.forEach((object) => box.expandByObject(object));
    box.getBoundingSphere(sphere);
    const r = sphere.radius * 1.05;
    light.target.position.copy(sphere.center);
    light.position.copy(sphere.center).add(offset);
    Object.assign(light.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: offset.length() + r * 2 });
    light.shadow.camera.updateProjectionMatrix();
  };
  return light;
}

// Invisible floor that only shows shadows, so the page's own colour is the ground.
export function shadowFloor(scene, opacity = 0.3) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  return floor;
}

// When WebGL is unavailable the page still works; the stage is simply empty.
export function webglAvailable() {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2'));
  } catch {
    return false;
  }
}
