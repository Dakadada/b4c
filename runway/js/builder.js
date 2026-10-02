import { BEADS, BEADS_BY_ID, CATEGORIES, DEFAULT_DESIGN, SLOT_COUNT } from './beads.js';

// ── State store ──────────────────────────────────────────────────────────────
const state = {
  slots: DEFAULT_DESIGN.slice(),
  activeBeadId: 'gold',
  activeCategory: 'metallic',
  selectedSlot: null,
};

const listeners = [];
export function subscribe(fn) {
  listeners.push(fn);
  fn(state);
  return () => { const index = listeners.indexOf(fn); if (index !== -1) listeners.splice(index, 1); };
}
function notify() {
  listeners.forEach((fn) => fn(state));
}
export function getState() {
  return state;
}

// ── Actions ──────────────────────────────────────────────────────────────────
function placeBead(beadId) {
  state.activeBeadId = beadId;
  if (state.selectedSlot !== null) {
    state.slots[state.selectedSlot] = beadId;
    // Advance around the ring so a row of beads can be "painted" in sequence.
    state.selectedSlot = (state.selectedSlot + 1) % SLOT_COUNT;
  } else {
    const empty = state.slots.indexOf(null);
    if (empty === -1) {
      flashHint();
      notify();
      return;
    }
    state.slots[empty] = beadId;
  }
  notify();
}

function selectSlot(index) {
  state.selectedSlot = state.selectedSlot === index ? null : index;
  notify();
}

function fillAll() {
  state.slots = state.slots.map((s) => s ?? state.activeBeadId);
  notify();
}

function shuffle() {
  state.slots = Array.from({ length: SLOT_COUNT }, () => BEADS[Math.floor(Math.random() * BEADS.length)].id);
  state.selectedSlot = null;
  notify();
}

function clear() {
  state.slots = Array(SLOT_COUNT).fill(null);
  state.selectedSlot = null;
  notify();
}

function setCategory(id) {
  state.activeCategory = id;
  notify();
}

// ── Swatch rendering ─────────────────────────────────────────────────────────
// CSS approximations of each material family, derived from the bead color.
// Also used by team.html for the bead avatars.
export function swatchStyle(bead) {
  return `--bead-color: ${bead.color}; background: ${bead.color};`;
}

// ── UI wiring ────────────────────────────────────────────────────────────────
let hintTimer;
function flashHint() {
  const hint = document.getElementById('builder-hint');
  hint.textContent = 'Bracelet is full — tap a bead on the bracelet to swap it.';
  hint.classList.add('is-visible');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hint.classList.remove('is-visible'), 3200);
}

export function initBuilder(scene) {
  const tabsEl = document.getElementById('palette-tabs');
  const gridEl = document.getElementById('palette-grid');
  const countEl = document.getElementById('bead-count');
  const slotControls = document.getElementById('slot-controls');
  const slotButtons = Array.from({ length: SLOT_COUNT }, (_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = index + 1;
    button.addEventListener('click', () => selectSlot(index));
    slotControls?.appendChild(button);
    return button;
  });

  CATEGORIES.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'palette-tab';
    btn.textContent = cat.label;
    btn.dataset.category = cat.id;
    btn.addEventListener('click', () => setCategory(cat.id));
    tabsEl.appendChild(btn);
  });

  function renderGrid() {
    gridEl.innerHTML = '';
    BEADS.filter((b) => b.category === state.activeCategory).forEach((bead) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch';
      btn.style.cssText = swatchStyle(bead);
      btn.dataset.beadId = bead.id;
      btn.dataset.category = bead.category;
      btn.setAttribute('aria-label', `Add ${bead.name} bead`);
      btn.setAttribute('aria-pressed', String(bead.id === state.activeBeadId));
      const label = document.createElement('span');
      label.className = 'swatch-label';
      label.textContent = bead.name;
      btn.appendChild(label);
      btn.addEventListener('click', () => placeBead(bead.id));
      gridEl.appendChild(btn);
    });
  }

  document.getElementById('btn-fill').addEventListener('click', fillAll);
  document.getElementById('btn-shuffle').addEventListener('click', shuffle);
  document.getElementById('btn-clear').addEventListener('click', clear);

  scene.setDesign(state.slots);

  subscribe((s) => {
    slotButtons.forEach((button, index) => {
      const bead = BEADS_BY_ID[s.slots[index]];
      button.style.cssText = bead ? swatchStyle(bead) : '';
      button.setAttribute('aria-label', `Bead ${index + 1}: ${bead?.name || 'empty'}`);
      button.setAttribute('aria-pressed', String(s.selectedSlot === index));
    });
    scene.setDesign(s.slots);
    scene.setSelectedSlot(s.selectedSlot);

    tabsEl.querySelectorAll('.palette-tab').forEach((t) => {
      t.setAttribute('aria-pressed', String(t.dataset.category === s.activeCategory));
    });
    const focusId = gridEl.contains(document.activeElement) ? document.activeElement.dataset.beadId : null;
    renderGrid();
    if (focusId) gridEl.querySelector(`[data-bead-id="${focusId}"]`)?.focus({ preventScroll: true });
    document.getElementById('selected-bead').textContent = `Selected bead: ${BEADS_BY_ID[s.activeBeadId].name}`;

    const filled = s.slots.filter(Boolean).length;
    countEl.textContent = `${filled} / ${SLOT_COUNT}`;

    const hint = document.getElementById('builder-hint');
    if (s.selectedSlot !== null) {
      hint.textContent = `Bead ${s.selectedSlot + 1} selected — pick a color to swap it, or tap it again to deselect.`;
      hint.classList.add('is-visible');
    } else if (!hint.classList.contains('is-visible') || hint.textContent.startsWith('Bead')) {
      hint.classList.remove('is-visible');
    }

    // Flat 18-dot strip mirrored in the order section.
    const strip = document.getElementById('design-strip');
    if (strip) {
      strip.innerHTML = '';
      s.slots.forEach((id) => {
        const dot = document.createElement('span');
        dot.className = 'strip-dot';
        if (id) dot.style.cssText = swatchStyle(BEADS_BY_ID[id]);
        else dot.classList.add('strip-dot-empty');
        strip.appendChild(dot);
      });
    }
  });

  return { selectSlot };
}
