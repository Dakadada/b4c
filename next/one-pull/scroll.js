// Scroll moments below the builder: the gold cord that keeps running down the page, and
// each of the three steps doing its own action as it comes into view. Everything here is
// an addition; with reduced motion (or without this script) the page shows its finished state.
const NS = 'http://www.w3.org/2000/svg';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const narrow = window.matchMedia('(max-width: 820px)');
const TURN = 28;
const HOLE_Y = 21; // centre of the punched hole in the order ticket, from its top edge

// ── The cord ─────────────────────────────────────────────────────────────────
// One path from the top of "Strung twice" to the order ticket: through the bead strip,
// down the gutter with a loop at each step, around the tally, and tied off at the ticket.
function initThread(main) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'thread');
  svg.setAttribute('aria-hidden', 'true');
  const shade = document.createElementNS(NS, 'path');
  const cord = document.createElementNS(NS, 'path');
  const knot = document.createElementNS(NS, 'circle');
  shade.setAttribute('class', 'thread-shade');
  cord.setAttribute('class', 'thread-cord');
  knot.setAttribute('class', 'thread-knot');
  knot.setAttribute('r', '4.5');
  svg.append(shade, cord, knot);
  main.append(svg);
  document.documentElement.classList.add('has-thread');

  const how = main.querySelector('.how');
  const strip = how.querySelector('.mini-strip');
  const steps = [...how.querySelectorAll('.step')];
  const ticket = main.querySelector('.ticket');
  let length = 0;
  let depth = []; // deepest y reached by each sample along the path
  let mainTop = 0;
  let drawn = 0;
  const SAMPLE = 12;

  function route() {
    const m = main.getBoundingClientRect();
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left - m.left, right: r.right - m.left, top: r.top - m.top, bottom: r.bottom - m.top, cx: r.left - m.left + r.width / 2, cy: r.top - m.top + r.height / 2 };
    };
    const h = box(how);
    const pad = parseFloat(getComputedStyle(how).paddingRight);
    const t = box(ticket);
    const above = t.top - (narrow.matches ? 14 : 30);
    const tie = [`L${t.cx + TURN},${above}`, `Q${t.cx},${above} ${t.cx},${above + TURN}`, `L${t.cx},${t.top + HOLE_Y}`];
    knot.setAttribute('cx', t.cx);
    knot.setAttribute('cy', t.top + HOLE_Y);

    if (narrow.matches) {
      // Phones: the cord hangs down the left edge, clear of the text, and comes in above the ticket.
      const x = h.left + pad / 2;
      return [`M${x},${h.top}`, `L${x},${above - TURN}`, `Q${x},${above} ${x + TURN},${above}`, `L${t.cx - TURN},${above}`, `Q${t.cx},${above} ${t.cx},${above + TURN}`, `L${t.cx},${t.top + HOLE_Y}`].join(' ');
    }

    const lane = h.right - pad / 2; // right-hand gutter
    const art = steps.map((step) => box(step.querySelector('.step-art')));
    const copy = box(steps[0].querySelector('.step-copy'));
    const gap = art[0].left - copy.right;
    const gx = copy.right + gap / 2; // the gutter between the words and the pictures
    const sy = box(strip).cy;
    const last = box(steps[2]);
    const under = last.bottom + (h.bottom - last.bottom) / 2;
    const w = Math.min(44, gap / 2 + 12);
    const loop = (y) => `L${gx},${y - 20} C${gx},${y + 26} ${gx + w},${y + 26} ${gx + w},${y - 4} C${gx + w},${y - 34} ${gx - 3},${y - 30} ${gx},${y + 6}`;
    return [
      `M${lane},${h.top}`, `L${lane},${sy - TURN}`, `Q${lane},${sy} ${lane - TURN},${sy}`,
      `L${gx + TURN},${sy}`, `Q${gx},${sy} ${gx},${sy + TURN}`,
      loop(art[1].cy - 34), loop(art[1].cy + 30), loop(art[2].cy),
      `L${gx},${under - TURN}`, `Q${gx},${under} ${gx + TURN},${under}`,
      `L${lane - TURN},${under}`, `Q${lane},${under} ${lane},${under + TURN}`,
      `L${lane},${above - TURN}`, `Q${lane},${above} ${lane - TURN},${above}`,
      ...tie,
    ].join(' ');
  }

  function draw() {
    // The tip follows a line most of the way down the viewport, and never unravels.
    const target = window.scrollY + window.innerHeight * 0.72 - mainTop;
    let lo = 0;
    let hi = depth.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (depth[mid] > target) hi = mid; else lo = mid + 1;
    }
    drawn = reduced.matches ? length : Math.max(drawn, Math.min(length, lo * SAMPLE));
    const offset = String(length - drawn);
    cord.style.strokeDashoffset = offset;
    shade.style.strokeDashoffset = offset;
    knot.style.opacity = drawn >= length - 1 ? '1' : '0';
  }

  function build() {
    const share = length ? drawn / length : 0;
    const d = route();
    cord.setAttribute('d', d);
    shade.setAttribute('d', d);
    length = cord.getTotalLength();
    cord.style.strokeDasharray = shade.style.strokeDasharray = `${length} ${length}`;
    depth = [];
    let deepest = -Infinity;
    for (let l = 0; l <= length; l += SAMPLE) {
      deepest = Math.max(deepest, cord.getPointAtLength(l).y);
      depth.push(deepest);
    }
    mainTop = main.getBoundingClientRect().top + window.scrollY;
    drawn = share * length;
    draw();
  }

  let queued = 0;
  const later = (fn) => () => { if (!queued) queued = requestAnimationFrame(() => { queued = 0; fn(); }); };
  new ResizeObserver(later(build)).observe(main);
  window.addEventListener('scroll', later(draw), { passive: true });
  reduced.addEventListener('change', draw);
  build();
}

// ── The note writes itself ───────────────────────────────────────────────────
// Each word appears by the line it sits on and how far along that line it is.
function splitNote(words) {
  const text = words.textContent;
  words.setAttribute('aria-label', text);
  words.replaceChildren(...text.split(/\s+/).filter(Boolean).flatMap((word, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = word;
    return i ? [' ', span] : [span];
  }));
  const tops = [...new Set([...words.children].map((span) => span.offsetTop))].sort((a, b) => a - b);
  words.style.setProperty('--n', tops.length);
  [...words.children].forEach((span) => {
    span.style.setProperty('--l', tops.indexOf(span.offsetTop));
    span.style.setProperty('--x', (span.offsetLeft / words.offsetWidth).toFixed(2));
  });
}

export function initScroll() {
  const main = document.querySelector('main');
  initThread(main);

  const words = document.getElementById('note-words');
  splitNote(words);
  // The order form rewrites the note; split again after it has.
  document.addEventListener('order-note', () => splitNote(words));

  if (reduced.matches) return;
  document.documentElement.classList.add('motion');
  // A little scrollytelling: each step plays as it rises into the middle of the screen and
  // rewinds on the way back, and the step nearest the middle is the one in focus.
  const steps = [...document.querySelectorAll('.how .step')].map((step) => ({ step, art: step.querySelector('.step-art') }));
  let queued = 0;
  function play() {
    queued = 0;
    const vh = window.innerHeight;
    let nearest = null;
    let best = Infinity;
    steps.forEach(({ step, art }) => {
      const r = art.getBoundingClientRect();
      const centre = r.top + r.height / 2;
      art.style.setProperty('--p', Math.max(0, Math.min(1, (vh * 0.92 - centre) / (vh * 0.42))).toFixed(3));
      const s = step.getBoundingClientRect();
      const off = Math.abs(s.top + s.height / 2 - vh / 2);
      if (off < best) { best = off; nearest = step; }
    });
    steps.forEach(({ step }) => step.classList.toggle('now', step === nearest));
  }
  const request = () => { if (!queued) queued = requestAnimationFrame(play); };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  play();
}
