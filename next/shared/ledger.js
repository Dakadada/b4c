import { THREE, createStage, softboxEnvironment, keyLight, shadowFloor, clamp01, ease, seeded, reducedMotion, webglAvailable } from './kit3d.js';
import { BEADS } from './beads.js';

const SPACING = 1.3;

/**
 * The tally, drawn as things you can count: one small ring per bracelet given.
 * `motion` is the page's own grammar: 'drop' (fall, bounce once) or 'draw'
 * (grow in order, like a row of stitches). Rings lift under the pointer.
 */
export function initLedger(canvas, { count = 650, motion = 'drop', floorOpacity = 0.3, envFloor = 0x555555, colors = BEADS.map((bead) => bead.color) } = {}) {
  if (!webglAvailable()) { canvas.hidden = true; return; }
  const stage = createStage(canvas, { eye: [0, 17, 8], look: [0, 0, 0.2] });
  const { scene } = stage;
  scene.environment = softboxEnvironment(stage.renderer, { floor: envFloor });
  const light = keyLight(scene);
  shadowFloor(scene, floorOpacity);

  const geometry = new THREE.TorusGeometry(0.4, 0.13, 10, 30);
  geometry.rotateX(Math.PI / 2);
  const material = new THREE.MeshPhysicalMaterial({ metalness: 0.2, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25 });
  const rings = new THREE.InstancedMesh(geometry, material, count);
  rings.castShadow = true;
  rings.receiveShadow = true;
  const group = new THREE.Group();
  group.add(rings);
  scene.add(group);

  const random = seeded(650);
  const tint = new THREE.Color();
  for (let i = 0; i < count; i++) rings.setColorAt(i, tint.set(colors[Math.floor(random() * colors.length)]));
  const turn = Float32Array.from({ length: count }, () => random() * Math.PI * 2);
  const home = new Float32Array(count * 2);
  const order = new Float32Array(count);

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const axis = new THREE.Vector3(0, 1, 0);
  const pointer = new THREE.Vector3(1e6, 0, 1e6);
  let lift = 0;
  let started = null;
  let settled = false;
  let cols = 1;

  function layout(width, height) {
    // Pick a grid whose shape matches the canvas, allowing for the camera's tilt.
    cols = Math.max(13, Math.min(50, Math.round(Math.sqrt(count * (width / height) * 0.82))));
    const rows = Math.ceil(count / cols);
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      home[i * 2] = (col - (cols - 1) / 2) * SPACING;
      home[i * 2 + 1] = (row - (rows - 1) / 2) * SPACING;
      order[i] = (row + col * 0.35) / (rows + cols * 0.35);
    }
    stage.fit(group, canvas, cols * SPACING + 2.2, rows * SPACING + 2.6);
    write(started === null ? 0 : 1e3);
    light.cover(group);
  }

  function write(elapsed) {
    const still = reducedMotion();
    const s = group.scale.x;
    let moving = false;
    for (let i = 0; i < count; i++) {
      const k = still ? 1 : clamp01((elapsed - order[i] * 1.5) / 0.75);
      if (k < 1) moving = true;
      const x = home[i * 2];
      const z = home[i * 2 + 1];
      const dx = x * s + group.position.x - pointer.x;
      const dz = z * s + group.position.z - pointer.z;
      const near = Math.max(0, 1 - Math.hypot(dx, dz) / (3.2 * s));
      let y = 0.13 + near * near * 0.9 * lift;
      let size = 1;
      if (motion === 'drop') {
        y += (1 - ease.outBounce(k)) * 7;
        size = k > 0 ? 1 : 0;
      } else {
        size = ease.outExpo(k);
      }
      position.set(x, y, z);
      quaternion.setFromAxisAngle(axis, turn[i]);
      matrix.compose(position, quaternion, scale.setScalar(size));
      rings.setMatrixAt(i, matrix);
    }
    rings.instanceMatrix.needsUpdate = true;
    return moving;
  }

  stage.onLayout(layout);
  stage.onFrame((t, dt) => {
    if (started === null) started = t;
    const target = pointer.x < 1e5 ? 1 : 0;
    lift += (target - lift) * (1 - Math.exp(-dt * 9));
    if (settled && lift < 0.002 && target === 0) return;
    settled = !write(t - started);
  });

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    stage.screenToGround(event.clientX - rect.left, event.clientY - rect.top, pointer);
  });
  canvas.addEventListener('pointerleave', () => pointer.set(1e6, 0, 1e6));
  stage.resize();
}
