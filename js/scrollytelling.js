// Impact figures shown in the pinned Impact section.
// ⚠️ Seed numbers — replace with Brace4Change's real statistics as they grow.
const CONFIG = {
  braceletsGiven: 900,
  notesWritten: 900,
  placesReached: 3,
  since: 'fall 2025',
};

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initSmoothScroll() {
  gsap.registerPlugin(ScrollTrigger);
  // Native scrolling keeps wheel/touch input on the browser's compositor.
  // Smooth only deliberate anchor jumps; never interpolate the user's input.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
    });
  });
}

// ── The cord: one continuous thread drawn down the whole page ────────────────
export function initCord() {
  const svg = document.getElementById('cord-svg');
  const path = document.getElementById('cord-path');
  const tip = document.getElementById('cord-tip');
  if (!svg) return;

  let len = 0;
  let curve;
  let framePending = false;
  const canvas = document.createElement('canvas');
  canvas.id = 'cord-renderer';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0';
  svg.after(canvas);
  const context = canvas.getContext('2d');
  const progress = { v: REDUCED_MOTION ? 1 : 0 };
  // Keep the vector as the geometry source, but rasterize only the viewport.
  // Animating the full-page SVG repainted a ~9,000px-tall surface each tick.
  svg.style.visibility = 'hidden';
  function draw() {
    framePending = false;
    if (!curve || !len) return;
    const w = document.documentElement.clientWidth;
    const h = window.innerHeight;
    context.clearRect(0, 0, w, h);
    context.save();
    context.translate(0, -window.scrollY);
    context.strokeStyle = 'rgba(124,33,54,.55)';
    context.lineWidth = 1.5;
    context.setLineDash([len, len]);
    context.lineDashOffset = len * (1 - progress.v);
    context.stroke(curve);
    if (!REDUCED_MOTION) {
      const point = path.getPointAtLength(len * progress.v);
      context.fillStyle = '#7c2136';
      context.beginPath();
      context.arc(point.x, point.y, 4, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
  function requestDraw() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(draw);
  }

  function build() {
    const w = document.documentElement.clientWidth;
    const h = document.documentElement.scrollHeight;
    if (w < 768) {
      svg.style.display = 'none';
      canvas.style.display = 'none';
      len = 0;
      return;
    }
    svg.style.display = '';
    canvas.style.display = '';
    const ratio = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);

    const anchors = [...document.querySelectorAll('[data-cord]')]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { x: parseFloat(el.dataset.cord) * w, y: r.top + window.scrollY + r.height / 2 };
      })
      .sort((a, b) => a.y - b.y);
    if (anchors.length < 2) return;

    let d = `M ${anchors[0].x} 0 L ${anchors[0].x} ${anchors[0].y}`;
    for (let i = 1; i < anchors.length; i++) {
      const a = anchors[i - 1];
      const b = anchors[i];
      const midY = (a.y + b.y) / 2;
      d += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
    }
    d += ` L ${anchors.at(-1).x} ${h}`;
    path.setAttribute('d', d);
    len = path.getTotalLength();
    curve = new Path2D(d);
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = REDUCED_MOTION ? 0 : len;
    requestDraw();
  }

  build();
  window.addEventListener('scroll', requestDraw, { passive: true });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh();
      build();
    }, 200);
  });

  if (REDUCED_MOTION) {
    tip.style.display = 'none';
    return;
  }

  gsap.to(progress, {
    v: 1,
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
    onUpdate() {
      if (!len) return;
      requestDraw();
    },
  });

}

// ── Hero entrance ────────────────────────────────────────────────────────────
export function initHero() {
  if (REDUCED_MOTION) return;
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero-object', { opacity: 0, scale: 0.94, duration: 0.8 }, 0)
    .from('.hero-line > span', { yPercent: 105, duration: 0.6, stagger: 0.08 }, 0)
    .from('[data-hero-fade], .hero-bottom', { opacity: 0, y: 18, duration: 0.45, stagger: 0.06 }, 0.1);
  if (window.innerWidth > 767) {
    gsap.to('.campaign-macro img', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.campaign-macro', start: 'top bottom', end: 'bottom top', scrub: true } });
  }
}

// ── How it works: pinned three-station sequence along the cord ───────────────
export function initHowItWorks() {
  const panels = gsap.utils.toArray('.how-panel');
  const markers = gsap.utils.toArray('.how-marker');

  if (REDUCED_MOTION) {
    document.getElementById('how-pin').classList.add('how-static');
    return;
  }

  gsap.set(panels.slice(1), { autoAlpha: 0, y: 40 });
  markers[0].classList.add('is-active');

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#how-pin',
      start: 'top top',
      end: '+=220%',
      pin: true,
      scrub: 0.5,
      onUpdate(self) {
        const idx = Math.min(2, Math.floor(self.progress * 3));
        markers.forEach((m, i) => m.classList.toggle('is-active', i <= idx));
      },
    },
  });

  tl.to('#how-rail-fill', { scaleX: 1, ease: 'none', duration: 3 }, 0);
  for (let i = 1; i < panels.length; i++) {
    tl.to(panels[i - 1], { autoAlpha: 0, y: -40, duration: 0.45 }, i - 0.25)
      .to(panels[i], { autoAlpha: 1, y: 0, duration: 0.45 }, i - 0.05);
  }
  tl.to({}, { duration: 0.4 }); // hold on the final station
}

// ── Impact: pinned counters + one-dot-per-bracelet grid ──────────────────────
export function initImpact(staticOnly = false) {
  const grid = document.getElementById('impact-grid');
  const dots = [];
  for (let i = 0; i < CONFIG.braceletsGiven; i++) {
    const d = document.createElement('span');
    d.className = 'impact-dot';
    grid.appendChild(d);
    dots.push(d);
  }

  document.getElementById('impact-since').textContent = `since ${CONFIG.since}`;

  const counters = [
    { el: document.getElementById('stat-bracelets'), target: CONFIG.braceletsGiven },
    { el: document.getElementById('stat-notes'), target: CONFIG.notesWritten },
    { el: document.getElementById('stat-places'), target: CONFIG.placesReached },
  ];

  if (REDUCED_MOTION || staticOnly) {
    counters.forEach(({ el, target }) => (el.textContent = target));
    dots.forEach((d) => d.classList.add('is-filled'));
    return;
  }

  counters.forEach(({ el, target }) => (el.textContent = '0'));

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#impact-pin',
      start: 'top top',
      end: '+=160%',
      pin: true,
      scrub: 0.5,
    },
  });

  counters.forEach(({ el, target }) => {
    const obj = { v: 0 };
    tl.to(obj, {
      v: target,
      duration: 1,
      ease: 'none',
      onUpdate: () => (el.textContent = Math.round(obj.v)),
    }, 0);
  });

  const fill = { n: 0 };
  let filledCount = 0;
  tl.to(fill, {
    n: dots.length,
    duration: 1,
    ease: 'none',
    onUpdate() {
      const upto = Math.floor(fill.n);
      // Only beads crossing the reveal boundary need a DOM mutation.
      // Works in both scroll directions and on large anchor jumps.
      for (let i = Math.min(filledCount, upto); i < Math.max(filledCount, upto); i++) {
        dots[i].classList.toggle('is-filled', i < upto);
      }
      filledCount = upto;
    },
  }, 0);
  tl.to({}, { duration: 0.25 });
}

// ── Generic fade-up reveals ──────────────────────────────────────────────────
export function initReveals() {
  if (REDUCED_MOTION) return;
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 28,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
    });
  });
}
