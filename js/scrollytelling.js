// Impact figures shown in the pinned Impact section.
// ⚠️ Seed numbers — replace with Brace4Change's real statistics as they grow.
const CONFIG = {
  braceletsGiven: 900,
  notesWritten: 900,
  placesReached: 3,
  since: 'fall 2025',
};

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis = null;

export function initSmoothScroll() {
  gsap.registerPlugin(ScrollTrigger);

  if (!REDUCED_MOTION) {
    lenis = new Lenis({ duration: 1.15 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Smooth anchor navigation.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0 });
      else target.scrollIntoView({ behavior: 'auto' });
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

  function build() {
    const w = document.documentElement.clientWidth;
    const h = document.documentElement.scrollHeight;
    if (w < 768) {
      svg.style.display = 'none';
      len = 0;
      return;
    }
    svg.style.display = '';
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
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = REDUCED_MOTION ? 0 : len;
  }

  build();

  if (REDUCED_MOTION) {
    tip.style.display = 'none';
    return;
  }

  const progress = { v: 0 };
  gsap.to(progress, {
    v: 1,
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
    onUpdate() {
      if (!len) return;
      path.style.strokeDashoffset = len * (1 - progress.v);
      const p = path.getPointAtLength(len * progress.v);
      tip.setAttribute('cx', p.x);
      tip.setAttribute('cy', p.y);
    },
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      build();
      ScrollTrigger.refresh();
    }, 200);
  });
}

// ── Hero entrance ────────────────────────────────────────────────────────────
export function initHero() {
  if (REDUCED_MOTION) return;
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero-line > span', { yPercent: 105, duration: 1.1, stagger: 0.12 }, 0.15)
    .from('[data-hero-fade]', { opacity: 0, y: 18, duration: 0.9, stagger: 0.1 }, 0.7);
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
export function initImpact() {
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

  if (REDUCED_MOTION) {
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
  tl.to(fill, {
    n: dots.length,
    duration: 1,
    ease: 'none',
    onUpdate() {
      const upto = Math.floor(fill.n);
      dots.forEach((d, i) => d.classList.toggle('is-filled', i < upto));
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
