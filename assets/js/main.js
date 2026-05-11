/* ===========================================================
   VANTAGE WEALTH — Investment Data Portal
   main.js — Password gate, component loader, nav highlight
   =========================================================== */

const PASSWORD = "16Parliament";

/* ----- Password Gate ----- */

function unlock() {
  const gate = document.getElementById('gate');
  const app  = document.getElementById('app');
  if (gate) gate.classList.add('hidden');
  if (app)  app.classList.remove('hidden');
  sessionStorage.setItem('vantage_unlocked', '1');
}

function initGate() {
  const btn   = document.getElementById('pwd-btn');
  const input = document.getElementById('pwd-input');
  const error = document.getElementById('pwd-error');

  if (!btn) return;

  btn.addEventListener('click', () => {
    if (input.value === PASSWORD) {
      unlock();
    } else {
      if (error) error.textContent = 'Incorrect password. Please try again.';
      input.value = '';
      input.focus();
    }
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') btn.click();
  });

  /* Auto-unlock if already authenticated this session */
  if (sessionStorage.getItem('vantage_unlocked') === '1') {
    unlock();
  }
}

/* ----- Component Loader ----- */

async function loadComponent(placeholderId, url) {
  const el = document.getElementById(placeholderId);
  if (!el) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    el.innerHTML = await res.text();
  } catch (e) {
    console.warn(`Could not load component (${url}):`, e.message);
    /* Components require a local HTTP server — file:// will fail here.
       Use VS Code Live Server, Python http.server, or similar. */
  }
}

/* ----- Active Nav Highlighting ----- */

function setActiveNav() {
  const page = document.body.dataset.page || '';
  if (!page) return;

  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === page) {
      link.classList.add('active');
      /* If inside a dropdown, also mark the parent toggle as active */
      const dropdown = link.closest('.nav-dropdown');
      if (dropdown) {
        const parentToggle = dropdown.querySelector(':scope > a');
        if (parentToggle) parentToggle.classList.add('active');
      }
    }
  });
}

/* ----- Footer Year ----- */

function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ----- Lock Button ----- */

function initLockBtn() {
  /* Button is inside the loaded nav component — wait for it */
  document.addEventListener('click', e => {
    if (e.target && e.target.id === 'logout-btn') {
      sessionStorage.removeItem('vantage_unlocked');
      const gate = document.getElementById('gate');
      const app  = document.getElementById('app');
      if (gate) gate.classList.remove('hidden');
      if (app)  app.classList.add('hidden');
    }
  });
}

/* ----- GitHub Pages Link Fix ----- */

function fixAbsoluteLinks() {
  if (window.location.hostname !== 'anguyen1992.github.io') return;
  const repoBase = '/i';
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith(repoBase + '/') && href !== repoBase) {
      a.setAttribute('href', repoBase + href);
    }
  });
}

/* ----- Bootstrap ----- */

async function init() {
  initGate();
  initLockBtn();

  /*
   * Determine the base path for component URLs.
   * Pages in /pages/ are one level deeper than root, so they need "../".
   * data-depth="1" on <body> signals a sub-page.
   */
  const depth = parseInt(document.body.dataset.depth || '0', 10);
  const base  = depth === 1 ? '../' : './';

  await Promise.all([
    loadComponent('nav-placeholder',    `${base}components/nav.html`),
    loadComponent('footer-placeholder', `${base}components/footer.html`),
  ]);

  /* Run after components are injected */
  setActiveNav();
  setFooterYear();
  fixAbsoluteLinks();
}

document.addEventListener('DOMContentLoaded', init);
