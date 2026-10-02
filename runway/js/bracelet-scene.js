import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SLOT_COUNT, BEADS_BY_ID } from './beads.js';

const RING_RADIUS = 2.1;
const BEAD_RADIUS = 0.36;
const EMPTY_SCALE = 0.5;
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Deterministic per-slot jitter so the ring reads handmade, not machined.
function jitter(i) {
  const s = Math.sin(i * 127.1) * 43758.5453;
  return (s - Math.floor(s)) - 0.5;
}

// Large studio softboxes give metal long, photographic reflections instead
// of the cluster of white pinpoints produced by the generic room preset.
function studioEnvironment(renderer) {
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x444444);
  const panels = [
    { position: [-3, 4, 4], size: [2, 7], color: 0xffffff, intensity: 5 },
    { position: [4, 1, 2], size: [1, 6], color: 0xffffff, intensity: 3 },
    { position: [0, -4, -2], size: [5, 1], color: 0xdadada, intensity: 2 },
  ];
  panels.forEach(({ position, size, color, intensity }) => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(...size),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    panel.position.set(...position);
    panel.lookAt(0, 0, 0);
    room.add(panel);
  });
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(room, 0.025);
  generator.dispose();
  room.children.forEach((panel) => { panel.geometry.dispose(); panel.material.dispose(); });
  return target;
}

function beadGeometry() {
  // Revolve a round profile with a real cord opening through its center.
  const hole = 0.055;
  const end = Math.acos(hole / BEAD_RADIUS);
  const points = [];
  for (let i = 0; i <= 36; i++) {
    const angle = -end + (2 * end * i) / 36;
    points.push(new THREE.Vector2(Math.cos(angle) * BEAD_RADIUS, Math.sin(angle) * BEAD_RADIUS));
  }
  points.push(new THREE.Vector2(hole, -Math.sin(end) * BEAD_RADIUS));
  return new THREE.LatheGeometry(points, 48);
}

/**
 * A self-contained bracelet renderer. Instantiated twice: an ambient one in
 * the hero and an interactive one in the builder. Rendering pauses while the
 * container is offscreen.
 */
export class BraceletScene {
  constructor(container, { interactive = false, onBeadClick = null } = {}) {
    this.container = container;
    this.interactive = interactive;
    this.onBeadClick = onBeadClick;
    this.visible = false;
    this.selectedSlot = null;
    this.clock = new THREE.Clock();
    this.paused = REDUCED_MOTION;
    this.dirty = true;
    this.measure = new URLSearchParams(location.search).has('measure');
    this.renderCount = 0;
    this.abort = new AbortController();
    document.addEventListener('campaign-motion', (event) => {
      this.paused = event.detail.paused;
      this.#renderOnce();
    }, { signal: this.abort.signal });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.#renderOnce();
    }, { signal: this.abort.signal });

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.environment = studioEnvironment(this.renderer);
    this.scene.environment = this.environment.texture;

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);

    const key = new THREE.DirectionalLight(0xffffff, 0.6);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -4;
    key.shadow.camera.right = key.shadow.camera.top = 4;
    key.shadow.bias = -0.001;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.7);
    rim.position.set(-4, 2, 2);
    this.scene.add(rim);
    const rose = new THREE.DirectionalLight(0xffffff, 0.3);
    rose.position.set(3, -3, 1);
    this.scene.add(rose);

    this.group = new THREE.Group();
    this.group.rotation.x = interactive ? -0.5 : -0.72;
    this.group.rotation.y = interactive ? 0 : -0.3;
    this.scene.add(this.group);

    const path = Array.from({ length: 72 }, (_, i) => {
      const a = i / 72 * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * RING_RADIUS, Math.sin(a) * RING_RADIUS, 0.02 * Math.sin(a * 3));
    });
    const cord = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path, true), 144, 0.04, 10, true),
      new THREE.MeshStandardMaterial({ color: 0x2a2825, roughness: 0.6 })
    );
    this.group.add(cord);

    this.beads = [];
    const geo = beadGeometry();
    for (let i = 0; i < SLOT_COUNT; i++) {
      const angle = (i / SLOT_COUNT) * Math.PI * 2;
      const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial());
      mesh.position.set(
        Math.cos(angle) * RING_RADIUS,
        Math.sin(angle) * RING_RADIUS,
        0.02 * Math.sin(angle * 3)
      );
      mesh.userData.slot = i;
      mesh.rotation.z = angle;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      this.beads.push(mesh);
    }

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.22 }));
    floor.position.z = -0.39;
    floor.receiveShadow = true;
    this.group.add(floor);
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = textureCanvas.height = 128;
    const ctx = textureCanvas.getContext('2d');
    const pixels = ctx.createImageData(128, 128);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const value = 125 + Math.floor((Math.sin(i * 12.9898) * 43758.5453 % 1) * 12);
      pixels.data.set([value, value, value, 255], i);
    }
    ctx.putImageData(pixels, 0, 0);
    this.surface = new THREE.CanvasTexture(textureCanvas);
    this.beads.forEach(mesh => { mesh.material.bumpMap = this.surface; mesh.material.bumpScale = 0.008; });
    if (interactive) this.#setupInteraction();

    this.resizeObserver = new ResizeObserver(() => this.#resize());
    this.resizeObserver.observe(container);
    this.#resize();

    this.io = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.#startLoop();
    }, { rootMargin: '0px' });
    this.io.observe(container);
  }

  #setupInteraction() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = false;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.55;
    this.controls.addEventListener('change', () => this.#renderOnce());

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0, downY = 0;

    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      downX = e.clientX;
      downY = e.clientY;
    });
    this.renderer.domElement.addEventListener('pointerup', (e) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return; // drag, not click
      const rect = this.renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, this.camera);
      const hit = raycaster.intersectObjects(this.beads)[0];
      if (hit && this.onBeadClick) this.onBeadClick(hit.object.userData.slot);
    }, { signal: this.abort.signal });
  }

  /** slots: array of bead ids (or null for an empty slot). */
  setDesign(slots) {
    if (this.slots && slots.every((id, index) => id === this.slots[index])) return;
    slots.forEach((beadId, i) => {
      const mesh = this.beads[i];
      const m = mesh.material;
      const bead = beadId ? BEADS_BY_ID[beadId] : null;
      // Reset to a neutral base so recipes never inherit a previous bead's props.
      m.metalness = 0;
      m.roughness = 0.5;
      m.clearcoat = 0;
      m.clearcoatRoughness = 0;
      m.sheen = 0;
      m.iridescence = 0;
      m.iridescenceIOR = 1.3;
      m.iridescenceThicknessRange = [100, 400];
      m.bumpScale = bead?.category === "solid" ? 0.012 : 0.004;
      m.transparent = !bead;
      m.opacity = bead ? 1 : 0.45;
      if (bead) {
        m.color.set(bead.color);
        Object.entries(bead.mat).forEach(([k, v]) => {
          if (k === 'iridescenceThicknessRange') m.iridescenceThicknessRange = v;
          else m[k] = v;
        });
        m.envMapIntensity = bead.category === 'metallic' ? 1.25 : 0.9;
        mesh.scale.set(1 + jitter(i) * 0.025, 0.98 + jitter(i + 2) * 0.035, 1 + jitter(i) * 0.025);
      } else {
        m.color.set(0xdedbd2);
        m.roughness = 1;
        mesh.scale.setScalar(EMPTY_SCALE);
      }
    });
    this.slots = slots.slice();
    this.#renderOnce();
  }

  setSelectedSlot(index) {
    if (this.selectedSlot !== null) {
      const prev = this.beads[this.selectedSlot];
      prev.material.emissiveIntensity = 0;
      prev.scale.setScalar(this.slots && this.slots[this.selectedSlot] ? 1 : EMPTY_SCALE);
    }
    this.selectedSlot = index;
    if (index !== null) {
      this.beads[index].material.emissive = new THREE.Color(0x7c2136);
    }
    this.#renderOnce();
  }

  #resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    this.camera.aspect = aspect;
    // Pull the camera back until the whole ring fits the narrower axis.
    const extent = RING_RADIUS + BEAD_RADIUS * 2 + 0.15;
    const halfFov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const dist = extent / (Math.tan(halfFov) * Math.min(1, aspect));
    this.camera.position.set(0, 0.4, dist);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.baseDistance = dist;
    if (this.pose) this.setCameraPose(this.pose);
    this.#renderOnce();
  }

  #renderOnce() {
    this.dirty = true;
    if (this.visible && !document.hidden) this.#startLoop();
  }

  setCameraPose(pose = {}) {
    this.pose = pose;
    const { zoom = 1, x = 0, y = 0, tilt = -0.55, turn = 0 } = pose;
    this.camera.position.set(x, y, (this.baseDistance || 9) / zoom);
    this.camera.lookAt(x, y, 0);
    this.group.rotation.set(tilt, turn, 0);
    this.#renderOnce();
  }

  setPresentationProgress(progress) {
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    const detail = THREE.MathUtils.smoothstep(p, 0.18, 0.48);
    const macro = THREE.MathUtils.smoothstep(p, 0.58, 0.85);
    this.setCameraPose({ zoom: 1 + detail * 0.35 + macro * 1.85,
      x: macro * 1.35, y: macro * 1.2, tilt: -0.55 + detail * 0.22, turn: detail * 0.25 });
  }

  #startLoop() {
    if (!this.visible || document.hidden || !this.dirty) return;
    this.renderer.render(this.scene, this.camera);
    if (this.measure) this.container.dataset.renders = String(++this.renderCount);
    this.dirty = false;
  }

  dispose() {
    this.abort.abort();
    this.resizeObserver.disconnect();
    this.io.disconnect();
    this.controls?.dispose();
    const geometries = new Set(), materials = new Set();
    this.scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
    this.surface.dispose();
    this.environment.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
