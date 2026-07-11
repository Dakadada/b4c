import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
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

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);

    const key = new THREE.DirectionalLight(0xffffff, 0.6);
    key.position.set(3, 5, 4);
    this.scene.add(key);

    this.group = new THREE.Group();
    this.group.rotation.x = -0.5;
    this.scene.add(this.group);

    const cord = new THREE.Mesh(
      new THREE.TorusGeometry(RING_RADIUS, 0.04, 12, 96),
      new THREE.MeshStandardMaterial({ color: 0x2a2825, roughness: 0.6 })
    );
    this.group.add(cord);

    this.beads = [];
    const geo = new THREE.SphereGeometry(BEAD_RADIUS, 40, 40);
    for (let i = 0; i < SLOT_COUNT; i++) {
      const angle = (i / SLOT_COUNT) * Math.PI * 2;
      const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial());
      mesh.position.set(
        Math.cos(angle) * (RING_RADIUS + jitter(i) * 0.05),
        Math.sin(angle) * (RING_RADIUS + jitter(i + 40) * 0.05),
        jitter(i + 80) * 0.1
      );
      mesh.userData.slot = i;
      this.group.add(mesh);
      this.beads.push(mesh);
    }

    if (interactive) this.#setupInteraction();

    this.resizeObserver = new ResizeObserver(() => this.#resize());
    this.resizeObserver.observe(container);
    this.#resize();

    this.io = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.#startLoop();
    }, { rootMargin: '100px' });
    this.io.observe(container);
  }

  #setupInteraction() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.55;

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
    });
  }

  /** slots: array of bead ids (or null for an empty slot). */
  setDesign(slots) {
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
      m.transparent = !bead;
      m.opacity = bead ? 1 : 0.45;
      if (bead) {
        m.color.set(bead.color);
        Object.entries(bead.mat).forEach(([k, v]) => {
          if (k === 'iridescenceThicknessRange') m.iridescenceThicknessRange = v;
          else m[k] = v;
        });
        mesh.scale.setScalar(1);
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
    this.#renderOnce();
  }

  #renderOnce() {
    this.renderer.render(this.scene, this.camera);
  }

  #startLoop() {
    if (this.looping) return;
    this.looping = true;
    const tick = () => {
      if (!this.visible) {
        this.looping = false;
        return;
      }
      const t = this.clock.getElapsedTime();
      if (!REDUCED_MOTION) this.group.rotation.z = t * 0.12;
      if (this.selectedSlot !== null) {
        const mesh = this.beads[this.selectedSlot];
        mesh.material.emissiveIntensity = 0.3 + Math.sin(t * 5) * 0.18;
        const base = this.slots && this.slots[this.selectedSlot] ? 1 : EMPTY_SCALE;
        mesh.scale.setScalar(base * (1.06 + Math.sin(t * 5) * 0.04));
      }
      if (this.controls) this.controls.update();
      this.#renderOnce();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
