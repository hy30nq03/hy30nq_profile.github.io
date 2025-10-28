const revealRegistry = new WeakSet();
const tiltRegistry = new WeakSet();
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let initialized = false;
let revealObserver;
let navObserver;
let heroSceneInitialized = false;
let heroAnimationFrameId = null;
let heroResizeHandler = null;
let heroCanvas;
let heroContext;
let heroWidth = 0;
let heroHeight = 0;
let heroParticles = [];

export function initEnhancements() {
  if (initialized) return;
  initialized = true;

  applyInitialTheme();
  setupThemeToggle();
  setupScrollProgress();
  setupRevealObserver();
  setupNavHighlight();
  setupHeroScene();

  registerRevealTargets(document.querySelectorAll('[data-animate]'));
  registerTiltTargets(document.querySelectorAll('[data-tilt]'));

  prefersReducedMotion.addEventListener('change', (event) => {
    if (event.matches) {
      stopHeroScene();
    } else {
      setupHeroScene(true);
    }
  });
}

export function registerRevealTargets(targets) {
  if (!revealObserver) return;
  const elements = Array.isArray(targets) ? targets : Array.from(targets || []);
  elements.forEach((element) => {
    if (!element || revealRegistry.has(element)) return;
    revealRegistry.add(element);
    if (!element.dataset.animate) {
      element.dataset.animate = 'fade';
    }
    revealObserver.observe(element);
  });
}

export function registerTiltTargets(targets) {
  if (prefersReducedMotion.matches) return;
  const elements = Array.isArray(targets) ? targets : Array.from(targets || []);
  elements.forEach((element) => {
    if (!element || tiltRegistry.has(element)) return;
    tiltRegistry.add(element);
    element.addEventListener('pointermove', handleTiltMove);
    element.addEventListener('pointerleave', handleTiltReset);
    element.addEventListener('pointerup', handleTiltReset);
    element.addEventListener('pointercancel', handleTiltReset);
  });
}

function applyInitialTheme() {
  const stored = localStorage.getItem('hy30nq-theme');
  if (stored === 'light' || stored === 'dark') {
    applyTheme(stored, false);
    return;
  }

  const existing = document.documentElement.dataset.theme || document.body.dataset.theme;
  if (existing) {
    applyTheme(existing, false);
    return;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light', false);
}

function setupThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    cycleTheme();
  });
}

function applyTheme(theme, persist = true) {
  const sanitized = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = sanitized;
  document.body.dataset.theme = sanitized;
  document.documentElement.style.colorScheme = sanitized;
  if (persist) {
    localStorage.setItem('hy30nq-theme', sanitized);
  }
}

function cycleTheme() {
  const current = document.documentElement.dataset.theme || document.body.dataset.theme || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

function setupScrollProgress() {
  const progressEl = document.querySelector('.scroll-progress');
  if (!progressEl) return;

  let ticking = false;

  const update = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    progressEl.style.setProperty('--scroll-progress', progress.toFixed(4));
  };

  const handle = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  window.addEventListener('scroll', handle, { passive: true });
  window.addEventListener('resize', handle, { passive: true });
  update();
}

function setupRevealObserver() {
  if (!('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: '0px 0px -10% 0px'
    }
  );
}

function setupNavHighlight() {
  if (!('IntersectionObserver' in window)) return;

  const nav = document.getElementById('primary-nav');
  if (!nav) return;

  const links = new Map();
  nav.querySelectorAll('a[href^="#"]').forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    if (id) {
      links.set(id, link);
    }
  });

  const sections = Array.from(document.querySelectorAll('main section[id]'));
  if (!sections.length) return;

  navObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visible.length) return;

      const sectionId = visible[0].target.id;
      if (!links.has(sectionId)) return;

      links.forEach((link, id) => {
        link.classList.toggle('is-active', id === sectionId);
      });
    },
    {
      threshold: 0.45,
      rootMargin: '-10% 0px -40% 0px'
    }
  );

  sections.forEach((section) => navObserver.observe(section));
}

function setupHeroScene(force = false) {
  if (heroSceneInitialized && !force) return;
  if (prefersReducedMotion.matches) return;

  heroCanvas = document.getElementById('hero-scene');
  if (!heroCanvas || typeof heroCanvas.getContext !== 'function') return;

  heroContext = heroCanvas.getContext('2d');
  if (!heroContext) return;

  heroSceneInitialized = true;

  if (heroResizeHandler) {
    window.removeEventListener('resize', heroResizeHandler);
  }

  heroResizeHandler = () => {
    const rect = heroCanvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      requestAnimationFrame(heroResizeHandler);
      return;
    }

    heroWidth = rect.width;
    heroHeight = rect.height;

    const dpr = window.devicePixelRatio || 1;
    heroCanvas.width = heroWidth * dpr;
    heroCanvas.height = heroHeight * dpr;
    heroContext.setTransform(dpr, 0, 0, dpr, 0, 0);

    heroParticles = createHeroParticles(Math.round((heroWidth + heroHeight) / 18));
  };

  window.addEventListener('resize', heroResizeHandler, { passive: true });
  heroResizeHandler();
  requestAnimationFrame(heroResizeHandler);

  const renderFrame = (timestamp) => {
    drawHeroScene(timestamp);
    heroAnimationFrameId = requestAnimationFrame(renderFrame);
  };

  if (heroAnimationFrameId) cancelAnimationFrame(heroAnimationFrameId);
  heroAnimationFrameId = requestAnimationFrame(renderFrame);
}

function stopHeroScene() {
  if (heroAnimationFrameId) {
    cancelAnimationFrame(heroAnimationFrameId);
    heroAnimationFrameId = null;
  }
  if (heroResizeHandler) {
    window.removeEventListener('resize', heroResizeHandler);
    heroResizeHandler = null;
  }
  if (heroContext) {
    heroContext.clearRect(0, 0, heroWidth, heroHeight);
  }
  heroSceneInitialized = false;
}

function createHeroParticles(count) {
  const particles = [];
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x: Math.random() * heroWidth,
      y: Math.random() * heroHeight,
      vx: (-0.25 + Math.random() * 0.5) || 0.12,
      vy: (-0.25 + Math.random() * 0.5) || -0.12,
      size: 1 + Math.random() * 1.8,
      alpha: 0.12 + Math.random() * 0.25,
      pulse: Math.random() * Math.PI * 2
    });
  }
  return particles;
}

function drawHeroScene(timestamp) {
  if (!heroContext) return;

  heroContext.clearRect(0, 0, heroWidth, heroHeight);

  const particleCount = heroParticles.length;
  for (let i = 0; i < particleCount; i += 1) {
    const particle = heroParticles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < -40 || particle.x > heroWidth + 40) {
      particle.vx *= -1;
    }
    if (particle.y < -40 || particle.y > heroHeight + 40) {
      particle.vy *= -1;
    }

    const flicker = 0.12 + Math.sin(timestamp * 0.0012 + particle.pulse) * 0.06;
    heroContext.beginPath();
    heroContext.fillStyle = `rgba(139, 92, 246, ${(particle.alpha + flicker).toFixed(3)})`;
    heroContext.shadowColor = 'rgba(139, 92, 246, 0.35)';
    heroContext.shadowBlur = 20;
    heroContext.arc(particle.x, particle.y, particle.size * 1.2, 0, Math.PI * 2);
    heroContext.fill();
    heroContext.shadowBlur = 0;
  }

  for (let i = 0; i < particleCount; i += 1) {
    const a = heroParticles[i];
    for (let j = i + 1; j < particleCount; j += 1) {
      const b = heroParticles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 140) {
        const alpha = (1 - distance / 140) * 0.18;
        heroContext.beginPath();
        heroContext.strokeStyle = `rgba(34, 211, 238, ${alpha.toFixed(3)})`;
        heroContext.lineWidth = 0.8;
        heroContext.moveTo(a.x, a.y);
        heroContext.lineTo(b.x, b.y);
        heroContext.stroke();
      }
    }
  }
}

function handleTiltMove(event) {
  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  const relX = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
  const relY = ((event.clientY - rect.top) / rect.height - 0.5) * -12;
  element.style.setProperty('--tiltX', relX.toFixed(2));
  element.style.setProperty('--tiltY', relY.toFixed(2));
}

function handleTiltReset(event) {
  const element = event.currentTarget;
  element.style.setProperty('--tiltX', '0');
  element.style.setProperty('--tiltY', '0');
}

export function shouldReduceMotion() {
  return prefersReducedMotion.matches;
}
