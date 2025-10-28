import { initEnhancements, registerRevealTargets, registerTiltTargets, shouldReduceMotion } from './ui.js';

const state = {
  data: null,
  language: 'en',
  isAuthenticated: false
};

// SHA512 해시된 비밀번호 (실제 비밀번호는 "[**secret**]")
const CORRECT_PASSWORD_HASH = '918e96c0a2d70d2881a8e59e7dd30ab7a5c264f21e16e02c92a15e7481ebc654d08130ab1aba6425355b143ddd93202136f0c533796754b59588c00092e8a4d7';

// 대외활동 비밀번호 해시 (실제 비밀번호는 "[**secret**]")
const ACTIVITIES_PASSWORD_HASH = '7b6025362eab2ba7c3109efd41c1905f0ec04fb27debf9ddc7e68753d3214f874ac76d0ed08e747c681173d7c2ac07f5d414d55638d2a13b22e3f5ecb5bb55de';

const SECTION_CONFIG = {
  awards: { titleId: 'awards-title', descriptionId: 'awards-description', containerId: 'awards-cards' },
  projects: { titleId: 'projects-title', descriptionId: 'projects-description', containerId: 'projects-cards' },
  cve: { titleId: 'cve-title', descriptionId: 'cve-description', containerId: 'cve-cards' },
  certifications: { titleId: 'certifications-title', descriptionId: 'certifications-description', containerId: 'certification-cards' },
  presentations: { titleId: 'presentations-title', descriptionId: 'presentations-description', containerId: 'presentations-cards' },
  education: { titleId: 'education-title', descriptionId: 'education-description', containerId: 'education-cards' },
  scholarships: { titleId: 'scholarships-title', descriptionId: 'scholarships-description', containerId: 'scholarship-cards' }
};

const TIMELINE_CONFIG = {
  training: { titleId: 'training-title', descriptionId: 'training-description', containerId: 'training-timeline' }
};

const DEVTOOLS_THRESHOLD = 150;
const DEVTOOLS_INTERVAL_MS = 500;
let devToolsMonitorId = null;
const devToolsState = {
  open: false
};

document.addEventListener('DOMContentLoaded', init);

function isDevToolsOpen() {
  return devToolsState.open;
}

async function init() {
  initEnhancements();
  startDevToolsMonitor();
  setupDevtoolsShortcutBlocker();
  checkAuthentication();

  if (state.isAuthenticated) {
    await hydrateAuthenticatedApp();
  } else {
    setupLoginForm();
  }

  setupActivitiesLogin();
}

async function hydrateAuthenticatedApp() {
  setupNavToggle();
  setupLanguageSwitch();
  updateYear();

  try {
    await loadProfileData();
    renderAll();
  } catch (error) {
    console.error(error);
    displayError('Failed to load embedded data bundle. Please verify the data-bundle script contents.');
  }
}

// SHA512 해시 함수
async function sha512(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// 세션 확인
function checkAuthentication() {
  const sessionKey = sessionStorage.getItem('portfolio_authenticated');
  if (sessionKey === 'true' && !isDevToolsOpen()) {
    state.isAuthenticated = true;
    showMainContent();
  } else if (sessionKey === 'true' && isDevToolsOpen()) {
    resetAuthentication('개발자 도구가 열려 있어 접근이 제한되었습니다.');
  }
}

// 로그인 폼 설정
function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  const loginModal = document.getElementById('login-modal');

  if (loginForm) {
    if (!loginForm.dataset.bound) {
      loginForm.addEventListener('submit', handleLogin);
      loginForm.dataset.bound = 'true';
    }
  }

  if (loginModal) {
    loginModal.style.display = 'flex';
  }
}

// 로그인 처리
async function handleLogin(event) {
  event.preventDefault();

  const passwordInput = document.getElementById('password');
  const password = passwordInput.value;

  if (!password) {
    showError('비밀번호를 입력하세요.');
    return;
  }

  if (isDevToolsOpen()) {
    resetAuthentication('개발자 도구를 닫은 후 다시 시도하세요.');
    passwordInput.value = '';
    return;
  }

  try {
    const hashedPassword = await sha512(password);

    if (hashedPassword === CORRECT_PASSWORD_HASH) {
      state.isAuthenticated = true;
      sessionStorage.setItem('portfolio_authenticated', 'true');
      clearLoginError();
      showMainContent();
      await hydrateAuthenticatedApp();
    } else {
      showError('잘못된 비밀번호입니다.');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('로그인 중 오류가 발생했습니다.');
  }
}

function showError(message) {
  const errorDiv = document.getElementById('login-error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

function clearLoginError() {
  const errorDiv = document.getElementById('login-error');
  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
  }
}

function showMainContent() {
  const loginModal = document.getElementById('login-modal');
  const mainContent = document.getElementById('main-content');

  if (loginModal) {
    loginModal.style.display = 'none';
  }

  if (mainContent) {
    mainContent.style.display = 'block';
  }
}

function hideMainContent() {
  const loginModal = document.getElementById('login-modal');
  const mainContent = document.getElementById('main-content');

  if (mainContent) {
    mainContent.style.display = 'none';
  }

  if (loginModal) {
    loginModal.style.display = 'flex';
  }
}

function setupDevtoolsShortcutBlocker() {
  window.addEventListener(
    'keydown',
    (event) => {
      const key = (event.key || '').toLowerCase();
      const isCtrlShift = (event.ctrlKey || event.metaKey) && event.shiftKey;
      const isMetaAlt = event.metaKey && event.altKey;
      if (
        key === 'f12' ||
        (isCtrlShift && (key === 'i' || key === 'j' || key === 'c' || key === 'u')) ||
        (isMetaAlt && key === 'i')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

function setupActivitiesLogin() {
  const activitiesLoginBtn = document.getElementById('activities-login-btn');
  const activitiesLoginForm = document.getElementById('activities-login-form');
  const activitiesCloseBtn = document.querySelector('[data-close-activities]');

  if (activitiesLoginBtn) {
    activitiesLoginBtn.addEventListener('click', showActivitiesLoginModal);
  }

  if (activitiesLoginForm) {
    activitiesLoginForm.addEventListener('submit', handleActivitiesLogin);
  }

  if (activitiesCloseBtn && !activitiesCloseBtn.dataset.bound) {
    activitiesCloseBtn.addEventListener('click', () => {
      hideActivitiesLoginModal();
      const passwordInput = document.getElementById('activities-password');
      if (passwordInput) {
        passwordInput.value = '';
      }
      const activitiesError = document.getElementById('activities-login-error');
      if (activitiesError) {
        activitiesError.textContent = '';
        activitiesError.style.display = 'none';
      }
    });
    activitiesCloseBtn.dataset.bound = 'true';
  }
}

function showActivitiesLoginModal() {
  const activitiesModal = document.getElementById('activities-login-modal');
  if (activitiesModal) {
    activitiesModal.style.display = 'flex';
  }
}

async function handleActivitiesLogin(event) {
  event.preventDefault();

  const passwordInput = document.getElementById('activities-password');
  const password = passwordInput.value;

  if (!password) {
    showActivitiesError('비밀번호를 입력하세요.');
    return;
  }

  try {
    const hashedPassword = await sha512(password);

    if (hashedPassword === ACTIVITIES_PASSWORD_HASH) {
      hideActivitiesLoginModal();
      showActivitiesContent();
    } else {
      showActivitiesError('잘못된 비밀번호입니다.');
    }
  } catch (error) {
    console.error('Activities login error:', error);
    showActivitiesError('로그인 중 오류가 발생했습니다.');
  }
}

function showActivitiesError(message) {
  const errorDiv = document.getElementById('activities-login-error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

function hideActivitiesLoginModal() {
  const activitiesModal = document.getElementById('activities-login-modal');
  if (activitiesModal) {
    activitiesModal.style.display = 'none';
  }
}

function showActivitiesContent() {
  const loginRequired = document.getElementById('activities-login-required');
  const activitiesContent = document.getElementById('activities-content');

  if (loginRequired) {
    loginRequired.style.display = 'none';
  }

  if (activitiesContent) {
    activitiesContent.style.display = 'block';
    renderActivitiesPrivateIfVisible();
  }
}

function setupNavToggle() {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (!navToggle || !nav) return;
  if (navToggle.dataset.bound === 'true') return;
  navToggle.dataset.bound = 'true';

  const closeNav = () => {
    navToggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  };

  const openNav = () => {
    navToggle.setAttribute('aria-expanded', 'true');
    nav.classList.add('is-open');
  };

  const handleDocumentClick = (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (event.target.closest('.nav-toggle') || event.target.closest('#primary-nav')) return;
    closeNav();
  };

  const handleDocumentKeydown = (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      closeNav();
      navToggle.focus();
    }
  };

  navToggle.addEventListener('click', () => {
    if (nav.classList.contains('is-open')) {
      closeNav();
    } else {
      openNav();
    }
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      closeNav();
    }
  });

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);
}

function setupLanguageSwitch() {
  const switcher = document.getElementById('language-switch');
  if (!switcher) return;

  switcher.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-lang]');
    if (!button) return;
    const lang = button.dataset.lang;
    if (lang === state.language) return;

    state.language = lang;
    updateLanguageButtons();
    renderAll();
    renderActivitiesPublic();
    renderActivitiesPrivateIfVisible();
  });
}

function updateLanguageButtons() {
  const switcher = document.getElementById('language-switch');
  if (!switcher) return;
  switcher.querySelectorAll('button[data-lang]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.lang === state.language);
  });
}

function updateYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

async function loadProfileData() {
  const bundleScript = document.getElementById('data-bundle');
  if (!bundleScript) {
    throw new Error('Missing data bundle script tag');
  }

  let bundle;
  try {
    bundle = JSON.parse(bundleScript.textContent || '{}');
  } catch (error) {
    throw new Error('Failed to parse embedded data bundle');
  }

  state.data = {
    hero: bundle.hero || {},
    contact: bundle.contact || {},
    sections: bundle.sections || {},
    timeline: bundle.timeline || {},
    languages: bundle.meta?.languages || [],
    defaultLanguage: bundle.meta?.defaultLanguage
  };

  if (Array.isArray(state.data.languages) && state.data.languages.includes('en')) {
    state.language = state.data.defaultLanguage || 'en';
  } else if (Array.isArray(state.data.languages) && state.data.languages.length) {
    state.language = state.data.languages[0];
  }

  updateLanguageButtons();
}

function renderAll() {
  if (!state.data) return;

  renderHero();
  renderContact();

  Object.entries(SECTION_CONFIG).forEach(([key, config]) => {
    const sectionData = state.data.sections?.[key];
    renderSection(config, sectionData);
  });

  renderLanguages();

  const activitiesRoot = state.data.timeline?.activities;
  if (activitiesRoot) {
    setText('activities-title', activitiesRoot.title);
    setText('activities-description', activitiesRoot.description, '');
  }

  Object.entries(TIMELINE_CONFIG).forEach(([key, config]) => {
    const raw = state.data.timeline?.[key];
    let timelineData = raw;
    if (key === 'training' && raw && !raw.groups && raw.private && Array.isArray(raw.private.groups)) {
      timelineData = { title: raw.title, description: raw.description, groups: raw.private.groups };
    }
    renderTimeline(config, timelineData);
  });

  renderActivitiesPublic();
  renderActivitiesPrivateIfVisible();
}

function renderHero() {
  const hero = state.data.hero || {};
  setText('hero-eyebrow', hero.eyebrow);
  setText('hero-title', hero.title);
  setText('hero-lead', hero.lead);

  renderAffiliations(hero.affiliations || []);
  renderHeroActions(hero.actions || []);
  renderHeroMetrics();
}

function renderHeroActions(actions) {
  const container = document.getElementById('hero-actions');
  if (!container) return;

  if (!actions.length) {
    container.innerHTML = '<p class="loading-message">Add hero actions to assets/data/profile.json.</p>';
    return;
  }

  container.innerHTML = '';
  const actionNodes = [];

  actions.forEach((action) => {
    const button = document.createElement('a');
    button.className = `btn ${action.style === 'primary' ? 'btn--primary' : 'btn--ghost'}`;
    button.textContent = getText(action.label) || 'Action';
    button.href = ensureHref(action.href);
    button.dataset.animate = 'pop';
    button.setAttribute('data-tilt', '');
    if (!action.href.startsWith('mailto:')) {
      button.target = '_blank';
      button.rel = 'noopener';
    }

    container.appendChild(button);
    actionNodes.push(button);
  });

  registerTiltTargets(actionNodes);
  registerRevealTargets(actionNodes);
}

function renderHeroMetrics() {
  const container = document.getElementById('hero-metrics');
  if (!container) return;

  const metrics = computeHeroMetrics();
  if (!metrics.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '';
  const nodes = [];

  metrics.forEach((metric, index) => {
    const card = document.createElement('article');
    card.className = 'metric-card';
    card.dataset.animate = 'rise';
    if (index > 1) {
      card.dataset.animate = 'fade';
    }
    card.setAttribute('data-tilt', '');

    const valueEl = document.createElement('strong');
    valueEl.textContent = shouldReduceMotion() ? metric.value : '0';
    valueEl.dataset.metricKey = metric.key;
    valueEl.dataset.locale = metric.locale;
    valueEl.dataset.target = String(metric.numericValue);
    valueEl.dataset.finalValue = metric.value;

    const labelEl = document.createElement('span');
    labelEl.textContent = metric.label;

    card.appendChild(valueEl);
    card.appendChild(labelEl);
    container.appendChild(card);
    nodes.push(card);

    animateMetricValue(valueEl, metric);
  });

  registerTiltTargets(nodes);
  registerRevealTargets(nodes);
}

function animateMetricValue(element, metric) {
  const target = Number(metric.numericValue);
  if (!Number.isFinite(target) || target < 0) {
    element.textContent = metric.value;
    return;
  }

  if (shouldReduceMotion()) {
    element.textContent = metric.value;
    return;
  }

  if (target === 0) {
    element.textContent = new Intl.NumberFormat(metric.locale).format(0);
    return;
  }

  const formatter = new Intl.NumberFormat(metric.locale);
  const duration = 900;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    element.textContent = formatter.format(current);
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = metric.value;
    }
  };

  element.textContent = formatter.format(0);
  requestAnimationFrame(tick);
}

function computeHeroMetrics() {
  if (!state.data) return [];

  const { sections = {}, timeline = {} } = state.data;
  const locale = state.language === 'ko' ? 'ko-KR' : 'en-US';
  const format = new Intl.NumberFormat(locale);

  const metrics = [];
  const awardsCount = sections.awards?.items?.length || 0;
  if (awardsCount) {
    metrics.push({
      key: 'awards',
      numericValue: awardsCount,
      value: format.format(awardsCount),
      label: getText({ en: 'National Honors', ko: '주요 수상' }),
      locale
    });
  }

  const projectCount = sections.projects?.items?.length || 0;
  if (projectCount) {
    metrics.push({
      key: 'projects',
      numericValue: projectCount,
      value: format.format(projectCount),
      label: getText({ en: 'Security Projects', ko: '보안 프로젝트' }),
      locale
    });
  }

  const cveCount = sections.cve?.items?.length || 0;
  if (cveCount) {
    metrics.push({
      key: 'cve',
      numericValue: cveCount,
      value: format.format(cveCount),
      label: getText({ en: 'CVE Releases', ko: '공개 CVE' }),
      locale
    });
  }

  const certCount = sections.certifications?.items?.length || 0;
  if (certCount) {
    metrics.push({
      key: 'certifications',
      numericValue: certCount,
      value: format.format(certCount),
      label: getText({ en: 'Certifications', ko: '자격 증명' }),
      locale
    });
  }

  const trainingGroups = extractTimelineGroups(timeline.training);
  const trainingCount = countTimelineItems(trainingGroups);
  if (trainingCount) {
    metrics.push({
      key: 'training',
      numericValue: trainingCount,
      value: format.format(trainingCount),
      label: getText({ en: 'Intensive Programs', ko: '집중 과정' }),
      locale
    });
  }

  return metrics.slice(0, 4);
}

function extractTimelineGroups(timelineSection) {
  if (!timelineSection) return [];
  if (Array.isArray(timelineSection.groups)) return timelineSection.groups;
  if (timelineSection.public && Array.isArray(timelineSection.public.groups)) {
    return timelineSection.public.groups;
  }
  if (timelineSection.private && Array.isArray(timelineSection.private.groups)) {
    return timelineSection.private.groups;
  }
  return [];
}

function countTimelineItems(groups) {
  return groups.reduce((total, group) => {
    const items = Array.isArray(group.items) ? group.items.length : 0;
    return total + items;
  }, 0);
}

function renderAffiliations(affiliations) {
  const container = document.getElementById('hero-affiliations');
  if (!container) return;

  if (!affiliations.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = affiliations
    .map((item) => {
      const label = getText(item);
      if (!label) return '';
      if (item.href) {
        const href = ensureHref(item.href);
        return `<a class="affiliation-chip" href="${href}" target="_blank" rel="noopener">${label}</a>`;
      }
      return `<span class="affiliation-chip">${label}</span>`;
    })
    .join('');
}

function renderContact() {
  const contact = state.data.contact || {};
  setText('contact-heading', contact.heading, 'Partner with hy30nq');
  setText('contact-description', contact.description, 'Contact channels will appear here when added to profile.json.');

  const container = document.getElementById('contact-cards');
  if (!container) return;

  const channels = contact.channels || [];
  if (!channels.length) {
    container.innerHTML = '<p class="loading-message">Add contact.channels to assets/data/profile.json.</p>';
    return;
  }

  container.innerHTML = '';
  const nodes = [];

  channels.forEach((channel) => {
    const card = document.createElement('article');
    card.className = 'contact-card';
    card.dataset.animate = 'rise';
    card.setAttribute('data-tilt', '');

    const label = getText(channel.label) || 'Contact';
    const description = getText(channel.description) || 'Updated from profile.json.';
    const valueMarkup = renderContactValue(channel);

    card.innerHTML = `
      <h3>${label}</h3>
      ${valueMarkup}
      <p>${description}</p>
    `;

    container.appendChild(card);
    nodes.push(card);
  });

  registerTiltTargets(nodes);
  registerRevealTargets(nodes);
}

function renderContactValue(channel) {
  const type = channel.type || 'link';
  const value = channel.value;
  const href = channel.href || value;

  if (type === 'email' && value) {
    return `<a href="mailto:${value}">${value}</a>`;
  }

  if (href) {
    const safeHref = ensureHref(href);
    const text = channel.display || value || safeHref;
    const label = getText(channel.label) || text;
    return `<a href="${safeHref}" target="_blank" rel="noopener">${text || label}</a>`;
  }

  return `<p class="contact-card__value">${value || getText(channel.label) || ''}</p>`;
}

function renderSection(config, sectionData) {
  setText(config.titleId, sectionData?.title);
  setText(config.descriptionId, sectionData?.description);

  const container = document.getElementById(config.containerId);
  if (!container) return;

  const items = sectionData?.items || [];
  if (!items.length) {
    container.innerHTML = '<p class="loading-message">No entries configured yet.</p>';
    return;
  }

  container.innerHTML = '';
  const nodes = [];

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.animate = 'rise';
    card.setAttribute('data-tilt', '');

    const title = getText(item.title) || getText(item.meta) || 'Entry';
    const meta = getText(item.meta);
    const body = getText(item.body);

    card.innerHTML = `
      <h3>${title}</h3>
      ${meta ? `<p class="card__meta">${meta}</p>` : ''}
      ${body ? `<div class="card__body">${body}</div>` : ''}
      ${renderLinks(item.links)}
    `;

    container.appendChild(card);
    nodes.push(card);
  });

  registerTiltTargets(nodes);
  registerRevealTargets(nodes);
}

function renderLanguages() {
  const section = state.data.sections?.languages || {};
  setText('languages-title', section.title);
  setText('languages-description', section.description);

  const container = document.getElementById('languages-grid');
  if (!container) return;

  const items = section.items || [];
  if (!items.length) {
    container.innerHTML = '<p class="loading-message">Add language entries in profile.json.</p>';
    return;
  }

  container.innerHTML = '';
  const nodes = [];

  items.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'info-card';
    article.dataset.animate = 'rise';
    article.setAttribute('data-tilt', '');

    const title = document.createElement('h3');
    title.textContent = getText(item.title) || 'Language';
    article.appendChild(title);

    const details = Array.isArray(item.details) ? item.details : [];
    if (details.length) {
      const list = document.createElement('ul');
      list.className = 'detail-list';
      details.forEach((detail) => {
        const li = document.createElement('li');
        li.textContent = getText(detail);
        list.appendChild(li);
      });
      article.appendChild(list);
    } else {
      const paragraph = document.createElement('p');
      paragraph.textContent = getText(item.description) || '';
      article.appendChild(paragraph);
    }

    container.appendChild(article);
    nodes.push(article);
  });

  registerTiltTargets(nodes);
  registerRevealTargets(nodes);
}

function renderTimeline(config, timelineData) {
  const container = document.getElementById(config.containerId);
  if (!container) return;

  setText(config.titleId, timelineData?.title);
  setText(config.descriptionId, timelineData?.description);

  const groups = timelineData?.groups || [];
  if (!groups.length) {
    container.innerHTML = '<p class="loading-message">Add timeline entries to profile.json.</p>';
    return;
  }

  container.innerHTML = '';
  const nodes = [];

  groups.forEach((group) => {
    const article = document.createElement('article');
    article.className = 'timeline-card';
    article.dataset.animate = 'rise';
    article.setAttribute('data-tilt', '');

    const groupTitle = getText(group.title) || 'Highlights';
    const heading = document.createElement('h3');
    heading.textContent = groupTitle;
    article.appendChild(heading);

    const list = document.createElement('ul');
    (group.items || []).forEach((item) => {
      const li = document.createElement('li');
      const title = getText(item.title);
      const details = getText(item.details);

      if (title) {
        const strong = document.createElement('strong');
        strong.textContent = title;
        li.appendChild(strong);
      }

      if (details) {
        const span = document.createElement('span');
        span.className = 'timeline-meta';
        span.textContent = details;
        li.appendChild(span);
      }

      const linksMarkup = renderInlineLinks(item.links);
      if (linksMarkup) {
        li.insertAdjacentHTML('beforeend', linksMarkup);
      }

      list.appendChild(li);
    });

    article.appendChild(list);
    container.appendChild(article);
    nodes.push(article);
  });

  registerTiltTargets(nodes);
  registerRevealTargets(nodes);
}

function renderActivitiesPublic() {
  const activities = state.data?.timeline?.activities || state.data?.timeline?.training;
  if (!activities || !activities.public) return;

  const publicConfig = {
    titleId: 'activities-public-title',
    descriptionId: 'activities-public-description',
    containerId: 'activities-public-timeline'
  };

  renderTimeline(publicConfig, activities.public);

  const publicTitle = document.getElementById('activities-public-title');
  if (publicTitle) publicTitle.textContent = '';
}

function renderActivitiesPrivateIfVisible() {
  const activitiesContent = document.getElementById('activities-content');
  const isVisible = activitiesContent && activitiesContent.style.display !== 'none';
  const activities = state.data?.timeline?.activities || state.data?.timeline?.training;
  if (!isVisible || !activities || !activities.private) return;

  const privateConfig = {
    titleId: 'activities-private-title',
    descriptionId: 'activities-private-description',
    containerId: 'activities-private-timeline'
  };

  renderTimeline(privateConfig, activities.private);
}

function renderLinks(links = []) {
  if (!links.length) return '';
  return `<div class="card__links">${links
    .map((link) => {
      const label = getText(link.label) || 'View';
      const href = ensureHref(link.href);
      return `<a href="${href}" target="_blank" rel="noopener">${label}</a>`;
    })
    .join('')}</div>`;
}

function renderInlineLinks(links = []) {
  if (!links.length) return '';
  const markup = links
    .map((link) => {
      const label = getText(link.label) || 'Link';
      const href = ensureHref(link.href);
      return `<a href="${href}" target="_blank" rel="noopener">${label}</a>`;
    })
    .join(' · ');
  return `<span class="timeline-meta">${markup}</span>`;
}

function ensureHref(href = '') {
  if (!href) return '#';
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
    return href;
  }
  return `https://${href.replace(/^\/+/, '')}`;
}

function getText(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return value[state.language] || value.en || Object.values(value)[0] || '';
}

function setText(elementId, value, fallback = '') {
  const el = document.getElementById(elementId);
  if (!el) return;
  const text = getText(value);
  el.textContent = text || fallback;
}

function displayError(message) {
  document.querySelectorAll('.loading-message').forEach((node) => {
    node.textContent = message;
    node.classList.add('error');
  });
}

function startDevToolsMonitor() {
  if (devToolsMonitorId) return;

  const detectConsoleInspection = () => {
    let detected = false;
    const detector = new Image();
    Object.defineProperty(detector, 'id', {
      get() {
        detected = true;
      }
    });
    console.log(detector);
    console.log('');
    return detected;
  };

  const evaluate = () => {
    const hasOuterWidth = typeof window.outerWidth === 'number' && window.outerWidth > 0;
    const hasOuterHeight = typeof window.outerHeight === 'number' && window.outerHeight > 0;
    const widthGap = hasOuterWidth ? Math.abs(window.outerWidth - window.innerWidth) > DEVTOOLS_THRESHOLD : false;
    const heightGap = hasOuterHeight ? Math.abs(window.outerHeight - window.innerHeight) > DEVTOOLS_THRESHOLD : false;
    let isOpen = widthGap || heightGap;

    if (!isOpen) {
      isOpen = detectConsoleInspection();
    }

    if (isOpen && !devToolsState.open) {
      devToolsState.open = true;
      handleDevToolsOpen();
    } else if (!isOpen && devToolsState.open) {
      devToolsState.open = false;
      handleDevToolsClose();
    }
  };

  devToolsMonitorId = window.setInterval(evaluate, DEVTOOLS_INTERVAL_MS);
  window.addEventListener('resize', evaluate);
  evaluate();
}

function handleDevToolsOpen() {
  showDevtoolsBlocker();
  resetAuthentication('개발자 도구 감지: 세션이 초기화되었습니다.');
}

function handleDevToolsClose() {
  hideDevtoolsBlocker();
  clearLoginError();
}

function resetAuthentication(message) {
  state.isAuthenticated = false;
  sessionStorage.removeItem('portfolio_authenticated');
  const nav = document.getElementById('primary-nav');
  if (nav) {
    nav.classList.remove('is-open');
  }
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
  }
  hideMainContent();
  setupLoginForm();
  clearLoginError();
  if (message) {
    showError(message);
  }
}

function showDevtoolsBlocker() {
  const blocker = document.getElementById('devtools-blocker');
  if (!blocker) return;
  blocker.classList.add('is-visible');
  blocker.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-devtools-blocked');
}

function hideDevtoolsBlocker() {
  const blocker = document.getElementById('devtools-blocker');
  if (!blocker) return;
  blocker.classList.remove('is-visible');
  blocker.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-devtools-blocked');
}
