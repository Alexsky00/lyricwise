// js/ui.js
// Shared UI utilities: navigation bar, confetti, toast messages.

import { router } from './router.js';

// ── Theme ─────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('lw_theme', theme);
}

// Apply stored theme immediately (before first render)
applyTheme(localStorage.getItem('lw_theme') || 'dark');

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
  // Sync all toggle checkboxes on the page
  document.querySelectorAll('.theme-toggle input').forEach(cb => {
    cb.checked = document.documentElement.getAttribute('data-theme') === 'light';
  });
}

// ── Nav ──────────────────────────────────────────────────────────

export function renderNav(activePage) {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  nav.innerHTML = `
    <a class="nav-logo" href="#" onclick="event.preventDefault(); lw.go('home')">
      🎵 Lyric<span>Wise</span>
    </a>
    <div class="nav-links">
      <a class="${activePage === 'home'  ? 'active' : ''}" href="#" onclick="event.preventDefault(); lw.go('home')">Home</a>
      <a class="${activePage === 'stats' ? 'active' : ''}" href="#" onclick="event.preventDefault(); lw.go('stats')">Stats</a>
      <a class="nav-cta${activePage === 'library' ? ' active' : ''}" href="#" onclick="event.preventDefault(); lw.go('library')">Browse Songs</a>
      <a class="nav-admin" href="#" onclick="event.preventDefault(); lw.go('admin')">Admin</a>
      <div style="position:relative;">
        <button class="nav-settings-btn" id="settings-btn" title="Settings" onclick="lw.toggleSettings()">⚙</button>
        <div class="settings-popover" id="settings-popover" style="display:none;">
          <div class="settings-popover-title">Settings</div>
          <div class="settings-row">
            <span class="settings-row-label">☀️ Light mode</span>
            <label class="theme-toggle">
              <input type="checkbox" ${isLight ? 'checked' : ''} onchange="lw.toggleTheme()"/>
              <span class="theme-toggle-track"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Global shortcut (used in onclick attributes in HTML) ──────────
window.lw = {
  go:            (page, params) => router.go(page, params),
  toggleTheme:   () => toggleTheme(),
  toggleSettings: () => {
    const pop = document.getElementById('settings-popover');
    if (!pop) return;
    const visible = pop.style.display !== 'none';
    pop.style.display = visible ? 'none' : 'block';
    if (!visible) {
      // Close on outside click
      setTimeout(() => {
        document.addEventListener('click', function handler(e) {
          if (!document.getElementById('settings-popover')?.contains(e.target) &&
              e.target.id !== 'settings-btn') {
            if (document.getElementById('settings-popover'))
              document.getElementById('settings-popover').style.display = 'none';
            document.removeEventListener('click', handler);
          }
        });
      }, 0);
    }
  },
};

// ── Toast ─────────────────────────────────────────────────────────

export function toast(message, type = 'info', duration = 3000) {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('visible'));
  setTimeout(() => {
    t.classList.remove('visible');
    setTimeout(() => t.remove(), 300);
  }, duration);
}

// ── Confetti ──────────────────────────────────────────────────────

export function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.style.display = 'block';
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 120 }, () => ({
    x:   Math.random() * canvas.width,
    y:   Math.random() * canvas.height - canvas.height,
    r:   Math.random() * 6 + 2,
    d:   Math.random() * 3 + 1,
    color: `hsl(${Math.random() * 360}, 80%, 60%)`,
    tilt: Math.random() * 10 - 10,
  }));

  let frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      p.y += p.d;
      p.x += Math.sin(p.tilt) * 0.5;
      if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
    });
    frame = requestAnimationFrame(draw);
  }
  draw();
  setTimeout(() => { cancelAnimationFrame(frame); ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.style.display = 'none'; }, 10000);
}
