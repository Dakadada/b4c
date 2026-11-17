import { THREE, createStage, softboxEnvironment, beadGeometry, BeadSet, createTweens, ease, clamp01, seeded, reducedMotion } from '../shared/kit3d.js';
import { SLOT_COUNT } from '../shared/beads.js';
import { subscribe, getState, setCursor } from '../shared/store.js';

const R = 0.3;
const GAP = 0.64;
const LENGTH = SLOT_COUNT * GAP;
const K_MAX = (Math.PI * 2) / LENGTH;
const RING_R = LENGTH / (Math.PI * 2);
const HANDLE_R = 0.8;
const SPLIT = RING_R + R + 0.55;
const CLOSE_END = 0.62; // share of the pull spent closing the ring; the rest slides the twin out
const RING_SPAN = RING_R * 2 + R * 2;

// Felt grain: fine, directionless noise. It gives the velvet a nap without any pattern
// that could band or read as a woven grid.
function napTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const g = canvas.getContext('2d');
  const image = g.createImageData(256, 256);
  const random = seeded(18);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 196 + random() * 59;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  g.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(30, 30);
  texture.anisotropy = 8;
  return texture;
}

export function initOnePull({ canvas, rigEl, handle, handleLabel, tagKept, tagGiven }) {
  const stage = createStage(canvas, { alpha: false });
  const { scene, renderer } = stage;
  renderer.setClearColor(0x120f18);
  scene.environment = softboxEnvironment(renderer, { floor: 0x2a2140, back: 0x8f8a9c });
  const tweens = createTweens();
  const still = reducedMotion;

  // Plum velvet, the kind a jeweller lays pieces on, under one warm pool of light.
  // The lavender comes from the nap catching the light at the edges of the pool.
  const nap = napTexture();
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(160, 160),
    new THREE.MeshPhysicalMaterial({ color: 0x150f20, map: nap, bumpMap: nap, bumpScale: 0.5, roughness: 1, sheen: 0.8, sheenColor: 0x6f5bb5, sheenRoughness: 0.55, envMapIntensity: 0.08 }));
  cloth.rotation.x = -Math.PI / 2;
  cloth.receiveShadow = true;
  scene.add(cloth);
  const spot = new THREE.SpotLight(0xfff1e2, 6.5, 0, 0.5, 1, 0);
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  spot.shadow.bias = -0.0003;
  spot.shadow.normalBias = 0.03;
  scene.add(spot, spot.target);

  // ── Rig: the cord, eighteen beads, their twin, and the pull ring ──────────
  // Pull-ring allowances shrink on upright screens so the beads can be larger. The rig is
  // framed twice: once for the flat cord, once for the two finished bracelets, and it eases
  // from one framing to the other as the ring closes so the result fills the stage.
  let leadLength = 70; // wide screens: the cord arrives from beyond the edge of the cloth
  let handleRest = 1.9;
  let handleTravel = 1;
  let baseScale = 1;
  let boost = 1;
  let offsetFlat = 0;
  let offsetRings = 0;
  const rig = new THREE.Group();
  const line = new THREE.Group();
  rig.add(line);
  scene.add(rig);

  const geometry = beadGeometry(R, 'high');
  const kept = new BeadSet(line, geometry);
  const twin = new BeadSet(line, geometry);
  const gold = new THREE.MeshStandardMaterial({ color: 0xe0b24a, metalness: 0.9, roughness: 0.34, envMapIntensity: 1.6 });
  const cord = new THREE.Mesh(new THREE.BufferGeometry(), gold);
  const tail = new THREE.Mesh(new THREE.BufferGeometry(), gold);
  const twinCord = new THREE.Mesh(new THREE.TorusGeometry(RING_R, 0.04, 8, 96).rotateX(Math.PI / 2), gold);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), gold);
  const leadIn = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 6).rotateZ(Math.PI / 2), gold);
  const twinKnot = knot.clone();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(HANDLE_R, 0.1, 14, 56).rotateX(Math.PI / 2), gold);
  const cursor = new THREE.Mesh(new THREE.RingGeometry(R * 1.1, R * 1.3, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xcdbdf5 }));
  [cord, tail, twinCord, knot, twinKnot, ring, leadIn].forEach((mesh) => { mesh.castShadow = true; });
  twinCord.position.y = R;
  ring.position.y = 0.1;
  cursor.position.y = 0.012;
  line.add(cord, tail, twinCord, knot, twinKnot, ring, cursor, leadIn);

  let pull = 0; // 0 flat, 1 two bracelets
  let target = 0;
  let dragging = false;
  let dirty = true;

  const points = Array.from({ length: SLOT_COUNT + 3 }, () => new THREE.Vector3());
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const tailCurve = new THREE.CubicBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
  const beadX = new Float32Array(SLOT_COUNT);
  const beadZ = new Float32Array(SLOT_COUNT);
  const world = new THREE.Vector3();

  // The line bends as an arc of constant length whose curvature rises until it
  // closes: one continuous cinch, the way a drawstring gathers.
  function arc(k, s, out) {
    const theta = k * s;
    out.x = k < 1e-5 ? s : Math.sin(theta) / k;
    out.z = k < 1e-5 ? 0 : -(1 - Math.cos(theta)) / k;
    return theta;
  }
  const p2 = { x: 0, z: 0 };

  function shape() {
    const close = ease.inOutCubic(clamp01(pull / CLOSE_END));
    line.position.x = offsetFlat + (offsetRings - offsetFlat) * close;
    rig.scale.setScalar(baseScale * (1 + (boost - 1) * close));
    rig.updateMatrixWorld(true);
    const split = ease.inOutCubic(clamp01((pull - CLOSE_END) / (1 - CLOSE_END)));
    const k = K_MAX * close;
    let cx = 0;
    let cz = 0;
    for (let i = 0; i < SLOT_COUNT; i++) {
      arc(k, (i + 0.5) * GAP, p2);
      beadX[i] = p2.x; beadZ[i] = p2.z; cx += p2.x; cz += p2.z;
    }
    cx /= SLOT_COUNT; cz /= SLOT_COUNT;
    const shift = SPLIT * split;
    // The kept bracelet lifts clear of its twin while they part, then settles beside it,
    // so the two rings never pass through each other.
    const lift = 0.78 * clamp01(split / 0.1) * (1 - ease.inOutCubic(clamp01((split - 0.8) / 0.2)));
    const top = R + lift;
    for (let i = 0; i < SLOT_COUNT; i++) {
      const theta = k * (i + 0.5) * GAP;
      const x = beadX[i] - cx;
      const z = beadZ[i] - cz;
      kept.meshes[i].position.set(x + shift, top, z);
      kept.orient(i, Math.cos(theta), -Math.sin(theta));
      twin.meshes[i].position.set(x - shift, R, z);
      twin.meshes[i].quaternion.copy(kept.meshes[i].quaternion);
      twin.meshes[i].visible = split > 0.001 && Boolean(getState().slots[i]);
      points[i + 2].set(x + shift, top, z);
    }
    // Cord ends: a short knotted tail at the start, the free end leaving at the join.
    arc(k, 0, p2);
    points[1].set(p2.x - cx + shift, top, p2.z - cz);
    points[0].set(points[1].x - 0.3, top, points[1].z);
    // Pulling draws the slack through from the far side until only a knotted stub is left.
    const slack = leadLength + (0.3 - leadLength) * ease.outExpo(clamp01(pull / CLOSE_END));
    leadIn.scale.x = slack;
    leadIn.position.set(points[1].x - slack / 2, top, points[1].z);
    knot.position.set(points[1].x - slack, top, points[1].z);
    const endTheta = arc(k, LENGTH, p2);
    points[SLOT_COUNT + 2].set(p2.x - cx + shift, top, p2.z - cz);
    cord.geometry.dispose();
    cord.geometry = new THREE.TubeGeometry(curve, 110, 0.04, 6, false);

    const end = points[SLOT_COUNT + 2];
    ring.position.set(LENGTH / 2 + handleRest + handleTravel * pull, 0.1, 0);
    tailCurve.v0.copy(end);
    tailCurve.v1.set(end.x + Math.cos(endTheta) * 1.3, top * 0.7, end.z - Math.sin(endTheta) * 1.3);
    tailCurve.v2.set(ring.position.x - HANDLE_R - 1.4, 0.12, 0);
    tailCurve.v3.set(ring.position.x - HANDLE_R, 0.1, 0);
    tail.geometry.dispose();
    tail.geometry = new THREE.TubeGeometry(tailCurve, 40, 0.04, 6, false);

    twinCord.visible = twinKnot.visible = split > 0.001;
    twinCord.position.set(-shift, R, 0);
    twinKnot.position.set(-shift - 0.28, R * 0.4 + 0.05, RING_R);
    moveCursor();
    placeDom(split);
    dirty = false;
  }

  function moveCursor() {
    const p = kept.meshes[getState().cursor].position;
    cursor.position.set(p.x, 0.012, p.z);
  }

  // DOM parts that ride on the 3D: the pull button over the gold ring, and the two tags.
  function placeDom(split) {
    const at = stage.worldToScreen(line.localToWorld(world.copy(ring.position)));
    const edge = stage.worldToScreen(line.localToWorld(world.set(ring.position.x + HANDLE_R + 0.25, 0.1, 0)));
    const size = Math.max(60, Math.hypot(edge.x - at.x, edge.y - at.y) * 2);
    Object.assign(handle.style, { width: `${size}px`, height: `${size}px`, transform: `translate(${at.x - size / 2}px, ${at.y - size / 2}px)` });
    [[tagKept, 1], [tagGiven, -1]].forEach(([tag, side]) => {
      const c = stage.worldToScreen(line.localToWorld(world.set(side * SPLIT * split, 0, 0)));
      tag.style.transform = `translate(${c.x}px, ${c.y}px) translate(-50%, -50%)`;
      tag.style.opacity = String(clamp01((split - 0.7) / 0.3));
    });
  }

  function layout(width, height) {
    const upright = height > width * 1.05;
    handleRest = upright ? 1.3 : 1.9;
    handleTravel = upright ? 0.7 : 1;
    const after = LENGTH / 2 + handleRest + handleTravel + HANDLE_R + 0.3;
    const flatBefore = LENGTH / 2 + (upright ? 1.3 : 0.5);
    const ringsBefore = SPLIT + RING_SPAN / 2 + 0.3;
    offsetFlat = -(after - flatBefore) / 2;
    offsetRings = -(after - ringsBefore) / 2;
    rig.rotation.y = upright ? -Math.PI / 2 : 0;
    leadLength = upright ? 0.9 : 70;
    const frame = (along, across) => stage.fit(rig, rigEl, along, across);
    const ringsScale = frame(ringsBefore + after, RING_SPAN + 0.4);
    baseScale = frame(flatBefore + after, RING_SPAN * 0.6);
    boost = Math.max(1, ringsScale / baseScale);
    spot.target.position.copy(rig.position);
    spot.position.set(rig.position.x - 3, 17, rig.position.z + 6);
    spot.angle = upright ? 0.42 : 0.5;
    shape();
  }
  stage.onLayout(layout);

  subscribe((state, event) => {
    dirty = true;
    if (event.type === 'cursor') return;
    [kept, twin].forEach((set, t) => state.slots.forEach((id, slot) => {
      const changed = event.type !== 'place' || event.slot === slot;
      if (!changed) return;
      set.apply(slot, id);
      if (!id || still()) return;
      const mesh = set.meshes[slot];
      mesh.scale.setScalar(0.001);
      tweens.add({ duration: 0.42, delay: (event.type === 'place' ? 0 : slot * 0.02) + t * 0.14, update: (k) => mesh.scale.setScalar(Math.max(0.001, k)) });
    }));
  });

  // ── Pull: drag the ring along the cord's direction, or tap it ─────────────
  const origin = new THREE.Vector3();
  let start = null;
  function pullDirection() {
    const a = stage.worldToScreen(line.localToWorld(origin.set(0, 0, 0)));
    const b = stage.worldToScreen(line.localToWorld(origin.set(1, 0, 0)));
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: (b.x - a.x) / length, y: (b.y - a.y) / length, unit: length };
  }
  function setTarget(value) {
    target = value;
    handle.setAttribute('aria-pressed', String(value === 1));
    handleLabel.textContent = value === 1 ? 'Release' : 'Pull';
  }
  handle.addEventListener('pointerdown', (event) => {
    handle.setPointerCapture(event.pointerId);
    start = { x: event.clientX, y: event.clientY, pull, moved: 0, direction: pullDirection() };
    dragging = true;
    interacted = true;
  });
  handle.addEventListener('pointermove', (event) => {
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start.moved = Math.max(start.moved, Math.hypot(dx, dy));
    const along = dx * start.direction.x + dy * start.direction.y;
    // A full pull is a comfortable thumb's travel, not the ring's small on-screen travel.
    pull = clamp01(start.pull + along / Math.max(150, start.direction.unit * 4.2));
    dirty = true;
  });
  let dragged = false;
  const release = () => {
    if (!start) return;
    dragged = start.moved >= 6;
    dragging = false;
    start = null;
    if (dragged) setTarget(pull > 0.5 ? 1 : 0);
  };
  handle.addEventListener('pointerup', release);
  handle.addEventListener('pointercancel', release);
  // A tap (or Enter/Space) toggles; the click that follows a drag is ignored.
  handle.addEventListener('click', (event) => {
    event.stopPropagation();
    interacted = true;
    if (dragged) { dragged = false; return; }
    setTarget(target === 1 ? 0 : 1);
  });

  canvas.parentElement.addEventListener('click', (event) => {
    const hit = stage.pick(event.clientX, event.clientY, kept.meshes.filter((mesh) => mesh.visible));
    if (hit) setCursor(hit.object.userData.slot);
  });

  // One small tug on load shows the cord is live.
  let interacted = false;
  let hint = still() ? -1 : 0;
  stage.onFrame((t, dt) => {
    tweens.step(dt);
    if (hint >= 0 && !interacted) {
      hint += dt;
      if (hint > 1.2 && hint < 2.6) { pull = 0.13 * Math.sin(((hint - 1.2) / 1.4) * Math.PI) ** 2; dirty = true; }
      if (hint >= 2.6) { pull = 0; hint = -1; dirty = true; }
    } else if (!dragging && pull !== target) {
      if (hint >= 0) hint = -1;
      const next = still() ? target : pull + (target - pull) * (1 - Math.exp(-dt * 3.4));
      pull = Math.abs(target - next) < 0.0008 ? target : next;
      dirty = true;
    }
    if (dirty) shape();
  });

  stage.resize();
}
