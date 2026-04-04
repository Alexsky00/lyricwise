// js/router.js
// Handles navigation between pages.
// Usage: router.go('library') or router.go('quiz', { songId: 'carry-on', level: 'A1' })

const PAGES = ['home', 'library', 'quiz', 'stats', 'admin', 'login', 'profile'];

function go(page, params = {}) {
  if (!PAGES.includes(page)) {
    console.error(`[router] Unknown page: ${page}`);
    return;
  }
  const inPages = window.location.pathname.includes('/pages/');
  const url = inPages ? `./${page}.html` : `./pages/${page}.html`;
  // Store params so the target page can read them
  if (Object.keys(params).length > 0) {
    sessionStorage.setItem('lw_nav_params', JSON.stringify(params));
  }
  window.location.href = url;
}

function getParams() {
  const raw = sessionStorage.getItem('lw_nav_params');
  if (!raw) return {};
  sessionStorage.removeItem('lw_nav_params');
  try { return JSON.parse(raw); }
  catch { return {}; }
}

function init() {
  // index.html just redirects to home
  go('home');
}

export const router = { go, getParams, init };
