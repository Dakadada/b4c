// Existing campaign figures; update these when the ledger changes.
const CONFIG = { braceletsGiven: 650, braceletsSold: 650, notesWritten: 650, placesReached: 3, since: 'fall 2025' };
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = false;
let context;
let responsive;
const still = () => paused || preference.matches;

export function initSmoothScroll() {
  gsap.registerPlugin(ScrollTrigger);
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: still() ? 'instant' : 'smooth' });
    });
  });
}

export function initImpact() {
  const grid = document.getElementById('impact-grid');
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < CONFIG.braceletsGiven; i++) {
    const dot = document.createElement('span');
    dot.className = 'impact-dot is-filled';
    fragment.appendChild(dot);
  }
  grid.replaceChildren(fragment);
  document.getElementById('impact-total').textContent = `${(CONFIG.braceletsGiven + CONFIG.braceletsSold).toLocaleString('en-US')} bracelets. One kept, one given.`;
  document.getElementById('impact-since').textContent = `since ${CONFIG.since}`;
  ['bracelets', 'sold', 'notes'].forEach((name, i) => {
    document.getElementById(`stat-${name}`).textContent = [CONFIG.braceletsGiven, CONFIG.braceletsSold, CONFIG.notesWritten][i];
  });
}

// All content is visible by default. Reverting this context restores a complete,
// readable page immediately, without removing pin spacers or changing page height.
export function initChoreography() {
  function build() {
    responsive?.revert();
    context?.revert();
    document.documentElement.classList.toggle('motion-paused', still());
    document.dispatchEvent(new CustomEvent('campaign-motion', { detail: { paused: still() } }));
    const toggle = document.getElementById('motion-toggle');
    toggle.setAttribute('aria-pressed', String(still()));
    toggle.textContent = preference.matches ? 'Reduced motion on' : paused ? 'Resume motion' : 'Pause motion';
    toggle.disabled = preference.matches;
    if (still()) return;
    context = gsap.context(() => {
      if (window.scrollY < 100) {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .from('.hero-spotlight', { opacity: 0, scaleX: 0.65, duration: 0.8 }, 0)
          .from('.hero-object', { opacity: 0, duration: 0.7 }, 0)
          .from('.hero-line > span', { yPercent: 110, duration: 0.55, stagger: 0.1 }, 0.05);
      }
      const grid = document.getElementById('impact-grid');
      const dots = [...grid.children];
      // Two overlapping blooms echo the two matching bracelets. Distances are
      // measured only when the field enters, so resizing before it is safe.
      const bloom = gsap.timeline({
        paused: true,
        onComplete: () => gsap.set(dots, { clearProps: 'transform,opacity' }),
      });
      gsap.set(dots, { opacity: 0.07 });
      ScrollTrigger.create({
        trigger: grid, start: 'top 85%', once: true,
        onEnter() {
          const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
          const rows = Math.ceil(dots.length / columns);
          const mobile = window.innerWidth < 900;
          bloom.fromTo(dots, {
            opacity: 0.07, scale: 0.9, y: mobile ? 8 : 16,
          }, {
            opacity: 1, scale: 1, y: 0,
            duration: mobile ? 0.45 : 0.65, ease: 'back.out(1.5)',
            stagger(index) {
              const x = (index % columns) / Math.max(1, columns - 1);
              const y = Math.floor(index / columns) / Math.max(1, rows - 1);
              const distance = Math.min(Math.hypot((x - 0.25) * 1.6, y - 0.5), Math.hypot((x - 0.75) * 1.6, y - 0.5));
              return distance * (mobile ? 1.3 : 2.2) + (index * 17 % 13) * 0.012;
            },
          }).play();
        },
      });
      gsap.from('#impact-pin > .grid > div', {
        opacity: 0, y: 18, duration: 0.65, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '#impact-pin', start: 'top 65%', once: true },
      });
      gsap.from('#builder > [data-reveal]', {
        y: 20, opacity: 0, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: '#builder', start: 'top 85%', once: true },
      });
    });
    responsive = gsap.matchMedia();
    responsive.add('(min-width: 900px)', () => {
      const panels = gsap.utils.toArray('.how-panel');
      panels.forEach((panel, i) => {
        gsap.from(panel, {
          opacity: 0.3, y: 30, ease: 'none',
          scrollTrigger: { trigger: panel, start: 'top 85%', end: 'top 45%', scrub: true },
        });
        ScrollTrigger.create({
          trigger: panel, start: 'top 60%', end: 'bottom 60%',
          onToggle: ({ isActive }) => {
            if (isActive) document.querySelectorAll('.how-marker').forEach((marker, j) => marker.classList.toggle('is-active', j === i));
          },
        });
      });
      gsap.fromTo('.story-photo img', { xPercent: -6, scale: 1.18 }, {
        xPercent: 6, scale: 1.06, ease: 'none',
        scrollTrigger: { trigger: '.story-layout', start: 'top 35%', end: 'bottom 75%', scrub: true },
      });
      gsap.to('#how-rail-fill', { scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: '.story-layout', start: 'top 55%', end: 'bottom 65%', scrub: true },
      });
      return () => document.querySelectorAll('.how-marker').forEach((marker) => marker.classList.remove('is-active'));
    });
  }
  document.getElementById('motion-toggle').addEventListener('click', () => { paused = !paused; build(); });
  preference.addEventListener('change', build);
  build();
}
