import { THREE, createStage, softboxEnvironment, keyLight, shadowFloor, clamp01, ease, seeded, reducedMotion, webglAvailable } from './kit3d.js';
import { BEADS } from './beads.js';

const SPACING = 1.3;

/**
 * The tally, drawn as things you can count: one small ring per bracelet given.
 * `motion` is the page's own grammar: 'drop' (fall, bounce once) or 'draw'
 * (grow in order, like a row of stitches). Rings lift under the pointer.
 * `yours` adds one more bracelet after the last ring, outlined and made of the
 * visitor's own eighteen beads; `yours.label` is a DOM element placed beneath it.
 */
export function initLedger(canvas, { count = 650, motion = 'drop', floorOpacity = 0.3, envFloor = 0x555555, colors = BEADS.map((bead) => bead.color), yours = null } = {}) {
  if (!webglAvailable()) { canvas.hidden = true; return { setYours() {} }; }
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
  const total = count + (yours ? 1 : 0);
  const home = new Float32Array(total * 2);
  const order = new Float32Array(total);

  // The visitor's bracelet: eighteen small beads and a lavender outline, in the next free place.
  const MINE_R = 0.6;
  let mine = null;
  if (yours) {
    const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.105, 14, 10), material, 18);
    beads.castShadow = true;
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.86, 0.96, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xb9a7e8 }));
    group.add(beads, halo);
    mine = { beads, halo, grow: 0 };
  }

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
    const rows = Math.ceil(total / cols);
    for (let i = 0; i < total; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      home[i * 2] = (col - (cols - 1) / 2) * SPACING;
      home[i * 2 + 1] = (row - (rows - 1) / 2) * SPACING;
      order[i] = (row + col * 0.35) / (rows + cols * 0.35);
    }
    if (mine) {
      // It is drawn larger than the rings, so it stands a little apart from the last one.
      home[count * 2] += (count % cols ? 0.5 : 0.15) * SPACING;
      home[count * 2 + 1] += 0.2 * SPACING;
    }
    stage.fit(group, canvas, cols * SPACING + 2.2, rows * SPACING + (mine ? 4.4 : 2.6));
    write(started === null ? 0 : 1e3);
    light.cover(group);
    if (mine && yours.label) {
      // The label sits just under the visitor's bracelet, kept inside the canvas.
      const at = stage.worldToScreen(group.localToWorld(position.set(home[count * 2], 0, home[count * 2 + 1] + 1.3)));
      const half = yours.label.offsetWidth / 2 + 8;
      yours.label.style.transform = `translate(${Math.max(half, Math.min(width - half, at.x))}px, ${at.y}px) translate(-50%, 0)`;
    }
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
    if (mine) {
      const k = still ? 1 : clamp01((elapsed - order[count] * 1.5 - 0.3) / 0.9);
      if (k < 1) moving = true;
      mine.grow = ease.outExpo(k);
      const x = home[count * 2];
      const z = home[count * 2 + 1];
      for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2;
        position.set(x + Math.cos(angle) * MINE_R, 0.105, z + Math.sin(angle) * MINE_R);
        matrix.compose(position, quaternion.identity(), scale.setScalar(mine.grow));
        mine.beads.setMatrixAt(i, matrix);
      }
      mine.beads.instanceMatrix.needsUpdate = true;
      mine.halo.position.set(x, 0.02, z);
      yours.label?.classList.toggle('on', k >= 1);
    }
    return moving;
  }

  stage.onLayout(layout);
  stage.onFrame((t, dt) => {
    if (started === null) started = t;
    const target = pointer.x < 1e5 ? 1 : 0;
    lift += (target - lift) * (1 - Math.exp(-dt * 9));
    if (!(settled && lift < 0.002 && target === 0)) settled = !write(t - started);
    if (mine) {
      // A slow pulse on the outline keeps the eye on the one ring that is not there yet.
      const pulse = reducedMotion() ? 1 : 1 + Math.sin(t * 2.2) * 0.06;
      mine.halo.scale.set(mine.grow * pulse, 1, mine.grow * pulse);
    }
  });

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    stage.screenToGround(event.clientX - rect.left, event.clientY - rect.top, pointer);
  });
  canvas.addEventListener('pointerleave', () => pointer.set(1e6, 0, 1e6));
  stage.resize();

  return {
    // Bead colours for the visitor's bracelet; empty slots show as bare cord.
    setYours(beadColors) {
      if (!mine) return;
      beadColors.forEach((color, i) => mine.beads.setColorAt(i, tint.set(color || '#5a5470')));
      mine.beads.instanceColor.needsUpdate = true;
    },
  };
}
