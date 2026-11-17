import { THREE, createStage, softboxEnvironment, keyLight, shadowFloor, beadGeometry, beadMaterial, BeadSet, createTweens, ease, seeded, reducedMotion } from '../shared/kit3d.js';
import { BEADS, BEADS_BY_ID, SLOT_COUNT } from '../shared/beads.js';
import { subscribe, getState, place, setCursor } from '../shared/store.js';

const COLS = 6;
const ROWS = 4;
const CELL = 1.96;
const WALL = 0.09;
const WALL_H = 0.98;
const BASE = 0.1;
const R = 0.28;
const RING_R = (SLOT_COUNT * R * 2 * 1.04) / (Math.PI * 2);
const TRAY_W = COLS * CELL;
const TRAY_D = ROWS * CELL;
const LIP = 0.17;
const CORNER = 0.6;
const OUTER_W = TRAY_W + LIP * 2;
const OUTER_D = TRAY_D + LIP * 2;

const cellCentre = (index) => ({
  x: ((index % COLS) - (COLS - 1) / 2) * CELL,
  z: (Math.floor(index / COLS) - (ROWS - 1) / 2) * CELL,
});

function roundedRect(path, w, d, r) {
  const x = -w / 2;
  const y = -d / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + d - r);
  path.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  path.lineTo(x + r, y + d);
  path.quadraticCurveTo(x, y + d, x, y + d - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

// Soft dark pad under the tray, so it sits on the table instead of floating over it.
function contactShadow() {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 224;
  const g = canvas.getContext('2d');
  g.shadowColor = 'rgba(10, 22, 96, 0.7)';
  g.shadowBlur = 30;
  g.shadowOffsetY = 8;
  g.fillStyle = 'rgba(10, 22, 96, 0.7)';
  g.beginPath();
  g.roundRect(44, 40, 232, 138, 18);
  g.fill();
  const pad = new THREE.Mesh(new THREE.PlaneGeometry((OUTER_W * 320) / 232, (OUTER_D * 224) / 138).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }));
  pad.position.y = 0.004;
  return pad;
}

function buildTray() {
  const tray = new THREE.Group();
  const up = (geometry) => geometry.rotateX(-Math.PI / 2);
  tray.add(contactShadow());

  // Moulded floor: tinted, a little glossy, rounded like the lid it would snap into.
  const base = new THREE.Mesh(up(new THREE.ExtrudeGeometry(roundedRect(new THREE.Shape(), OUTER_W, OUTER_D, CORNER), { depth: BASE, bevelEnabled: false, curveSegments: 10 })),
    new THREE.MeshPhysicalMaterial({ color: 0x9db4ff, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.3 }));
  base.receiveShadow = true;
  tray.add(base);

  // Clear plastic reads from its edges: faint faces, bright rims.
  const plastic = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.13, roughness: 0.05, clearcoat: 1, envMapIntensity: 2.4, depthWrite: false, side: THREE.DoubleSide });
  const rim = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, depthWrite: false });
  const ring = roundedRect(new THREE.Shape(), OUTER_W, OUTER_D, CORNER);
  ring.holes.push(roundedRect(new THREE.Path(), OUTER_W - LIP * 2, OUTER_D - LIP * 2, CORNER - LIP));
  const outer = new THREE.Mesh(up(new THREE.ExtrudeGeometry(ring, { depth: WALL_H, bevelEnabled: false, curveSegments: 10 })), plastic);
  outer.position.y = BASE;
  outer.renderOrder = 2;
  const outerRim = new THREE.Mesh(up(new THREE.ExtrudeGeometry(ring, { depth: 0.04, bevelEnabled: false, curveSegments: 10 })), rim);
  outerRim.position.y = BASE + WALL_H;
  outerRim.renderOrder = 3;
  tray.add(outer, outerRim);
  const divider = (w, d, x, z) => {
    const body = new THREE.Mesh(new THREE.BoxGeometry(w || WALL, WALL_H - 0.06, d || WALL), plastic);
    body.position.set(x, BASE + (WALL_H - 0.06) / 2, z);
    body.renderOrder = 2;
    const edge = new THREE.Mesh(new THREE.BoxGeometry(w || WALL * 0.7, 0.03, d || WALL * 0.7), rim);
    edge.position.set(x, BASE + WALL_H - 0.06, z);
    edge.renderOrder = 3;
    tray.add(body, edge);
  };
  for (let c = 1; c < COLS; c++) divider(0, TRAY_D, (c - COLS / 2) * CELL, 0);
  for (let r = 1; r < ROWS; r++) divider(TRAY_W, 0, 0, (r - ROWS / 2) * CELL);
  return tray;
}

// A loose handful per compartment: a jittered floor layer and a few on top,
// kept clear of the dividers and below the rim.
function pilePositions(index) {
  const random = seeded(index * 97 + 13);
  const spots = [];
  const skip = Math.floor(random() * 9);
  for (let i = 0; i < 9; i++) {
    if (i === skip) continue;
    spots.push([((i % 3) - 1) * 0.555 + (random() - 0.5) * 0.06, BASE + R, (Math.floor(i / 3) - 1) * 0.555 + (random() - 0.5) * 0.06]);
  }
  [[-0.28, -0.28], [0.28, 0.28], [0.28, -0.28], [-0.28, 0.28]].forEach(([x, z]) => {
    if (random() < 0.8) spots.push([x + (random() - 0.5) * 0.05, BASE + R + R * 1.3, z + (random() - 0.5) * 0.05]);
  });
  return spots.map(([x, y, z]) => ({ x, y, z, rx: random() * 6.28, ry: random() * 6.28, rz: random() * 6.28, phase: random() * 6.28 }));
}

export function initBeadBox({ canvas, trayEl, keptEl, givenEl, hitLayer, onHover }) {
  const stage = createStage(canvas, { eye: [0, 15.6, 7.6] });
  const { scene } = stage;
  scene.environment = softboxEnvironment(stage.renderer, { floor: 0x2f5bea, back: 0x4a5a8a });
  const light = keyLight(scene, { position: [-6, 12, 5], mapSize: window.innerWidth < 800 ? 2048 : 4096 });
  shadowFloor(scene, 0.34);
  const tweens = createTweens();
  const still = reducedMotion;

  // ── Tray and piles ─────────────────────────────────────────────────────────
  const tray = buildTray();
  scene.add(tray);
  // Loose beads are plain spheres: at this size a cord hole only reads as a blemish.
  const pileGeometry = new THREE.SphereGeometry(R, 24, 16);
  const dummy = new THREE.Object3D();
  const piles = BEADS.map((bead, index) => {
    const spots = pilePositions(index);
    const mesh = new THREE.InstancedMesh(pileGeometry, beadMaterial(bead.id), spots.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const centre = cellCentre(index);
    mesh.position.set(centre.x, 0, centre.z);
    tray.add(mesh);
    const pile = { mesh, spots, energy: 0, centre };
    writePile(pile, 0);
    return pile;
  });
  function writePile(pile, t) {
    pile.spots.forEach((spot, i) => {
      const hop = pile.energy > 0.01 ? Math.abs(Math.sin(t * 17 + spot.phase)) * pile.energy * 0.3 : 0;
      dummy.position.set(spot.x, spot.y + hop, spot.z);
      dummy.rotation.set(spot.rx + hop * 3, spot.ry, spot.rz);
      dummy.updateMatrix();
      pile.mesh.setMatrixAt(i, dummy.matrix);
    });
    pile.mesh.instanceMatrix.needsUpdate = true;
  }

  // ── The two bracelets ──────────────────────────────────────────────────────
  const ringGeometry = beadGeometry(R, 'high');
  const cordMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f6fb, roughness: 0.4 });
  const ghostMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
  const ghostGeometry = new THREE.RingGeometry(R * 0.55, R * 0.72, 28).rotateX(-Math.PI / 2);
  function buildBracelet(cursorColor) {
    const group = new THREE.Group();
    const spin = new THREE.Group();
    group.add(spin);
    const cord = new THREE.Mesh(new THREE.TorusGeometry(RING_R, 0.04, 8, 72).rotateX(Math.PI / 2), cordMaterial);
    cord.position.y = R;
    cord.castShadow = true;
    spin.add(cord);
    const beads = new BeadSet(spin, ringGeometry);
    const ghosts = beads.meshes.map((mesh, slot) => {
      const angle = (slot / SLOT_COUNT) * Math.PI * 2 - Math.PI / 2;
      mesh.position.set(Math.cos(angle) * RING_R, R, Math.sin(angle) * RING_R);
      beads.orient(slot, -Math.sin(angle), Math.cos(angle));
      const ghost = new THREE.Mesh(ghostGeometry, ghostMaterial);
      ghost.position.set(mesh.position.x, 0.02, mesh.position.z);
      spin.add(ghost);
      return ghost;
    });
    const cursor = new THREE.Mesh(new THREE.TorusGeometry(R * 1.32, 0.045, 8, 40).rotateX(Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: cursorColor }));
    cursor.position.y = 0.05;
    spin.add(cursor);
    scene.add(group);
    return { group, spin, beads, ghosts, cursor };
  }
  const kept = buildBracelet(0xffd23f);
  const given = buildBracelet(0xff5d8f);
  const bracelets = [kept, given];

  function showSlot(bracelet, slot, id) {
    bracelet.beads.apply(slot, id);
    bracelet.ghosts[slot].visible = !id;
  }
  function moveCursor(slot) {
    bracelets.forEach(({ beads, cursor }) => {
      const p = beads.meshes[slot].position;
      cursor.position.set(p.x, 0.05, p.z);
    });
  }

  // ── A bead leaves its compartment and lands on a bracelet ──────────────────
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  function hop(bracelet, slot, id, delay) {
    const target = bracelet.beads.meshes[slot];
    const pile = piles[BEADS.indexOf(BEADS_BY_ID[id])];
    tweens.add({ duration: 0.14, delay, update: (k) => target.scale.setScalar(Math.max(0.001, 1 - k)), done: () => { target.visible = false; } });
    const flyer = new THREE.Mesh(ringGeometry, beadMaterial(id));
    flyer.castShadow = true;
    flyer.visible = false;
    scene.add(flyer);
    pile.energy = 1;
    tweens.add({
      duration: 0.58, delay, easing: ease.inOutQuad,
      update: (k, raw) => {
        flyer.visible = true;
        tray.localToWorld(from.set(pile.centre.x, BASE + R * 2.4, pile.centre.z));
        target.getWorldPosition(to);
        flyer.position.lerpVectors(from, to, k);
        flyer.position.y += Math.sin(raw * Math.PI) * 3.2 * bracelet.group.scale.x;
        flyer.scale.setScalar(tray.scale.x + (bracelet.group.scale.x - tray.scale.x) * k);
        flyer.rotation.set(raw * 7, raw * 3, 0);
      },
      done: () => {
        scene.remove(flyer);
        showSlot(bracelet, slot, id);
        // Land with weight: squash, then one rebound.
        tweens.add({ duration: 0.36, easing: ease.outBack, update: (k) => target.scale.set(1.18 - 0.18 * k, 0.7 + 0.3 * k, 1.18 - 0.18 * k) });
      },
    });
  }

  subscribe((state, event) => {
    moveCursor(state.cursor);
    if (event.type === 'cursor') return;
    if (event.type === 'place' && !still()) {
      hop(kept, event.slot, event.beadId, 0);
      hop(given, event.slot, event.beadId, 0.16);
      return;
    }
    bracelets.forEach((bracelet, b) => state.slots.forEach((id, slot) => {
      showSlot(bracelet, slot, id);
      if (!id || still()) return;
      const mesh = bracelet.beads.meshes[slot];
      mesh.scale.setScalar(0.001);
      tweens.add({ duration: 0.4, delay: slot * 0.022 + b * 0.16, easing: ease.outBack, update: (k) => mesh.scale.setScalar(Math.max(0.001, k)) });
    }));
  });

  // ── One real button per compartment, laid over its projection ──────────────
  const corner = new THREE.Vector3();
  const buttons = BEADS.map((bead, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cell-hit';
    button.setAttribute('aria-label', `Add a ${bead.name} bead`);
    button.addEventListener('click', () => place(bead.id));
    const rattle = () => { piles[index].energy = Math.max(piles[index].energy, 0.7); onHover?.(bead); };
    button.addEventListener('pointerenter', rattle);
    button.addEventListener('focus', rattle);
    button.addEventListener('pointerleave', () => onHover?.(null));
    button.addEventListener('blur', () => onHover?.(null));
    hitLayer.append(button);
    return button;
  });
  function placeButtons() {
    buttons.forEach((button, index) => {
      const c = cellCentre(index);
      let left = Infinity; let top = Infinity; let right = -Infinity; let bottom = -Infinity;
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
        const p = stage.worldToScreen(tray.localToWorld(corner.set(c.x + (sx * CELL) / 2, BASE + WALL_H, c.z + (sz * CELL) / 2)));
        left = Math.min(left, p.x); right = Math.max(right, p.x); top = Math.min(top, p.y); bottom = Math.max(bottom, p.y);
      });
      Object.assign(button.style, { left: `${left}px`, top: `${top}px`, width: `${right - left}px`, height: `${bottom - top}px` });
    });
  }

  stage.onLayout(() => {
    stage.fit(tray, trayEl, OUTER_W + 0.5, OUTER_D + 1.5);
    const footprint = (RING_R + R) * 2 + 0.5;
    stage.fit(kept.group, keptEl, footprint, footprint);
    stage.fit(given.group, givenEl, footprint, footprint);
    light.cover(tray, kept.group, given.group);
    placeButtons();
  });

  stage.onFrame((t, dt) => {
    tweens.step(dt);
    piles.forEach((pile) => {
      if (pile.energy <= 0.01) return;
      pile.energy *= Math.exp(-dt * 4.5);
      writePile(pile, t);
    });
    if (!still()) {
      const turn = Math.sin(t * 0.35) * 0.12;
      kept.spin.rotation.y = turn;
      given.spin.rotation.y = -turn;
    }
  });

  // Mouse users can also click a bead on the kept bracelet to move the cursor there.
  canvas.parentElement.addEventListener('click', (event) => {
    const hit = stage.pick(event.clientX, event.clientY, kept.beads.meshes.filter((mesh) => mesh.visible));
    if (hit) setCursor(hit.object.userData.slot);
  });

  moveCursor(getState().cursor);
  stage.resize();
}
