// js/ui.js
// Shared UI utilities: navigation bar, confetti, toast messages.

import { router } from './router.js';

// ── Version ───────────────────────────────────────────────────────
export const APP_VERSION = '1.9-Alpha';

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

/**
 * @param {string} activePage
 * @param {object|null} profile  — Firestore profile object (optional)
 */
export function renderNav(activePage, profile = null) {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';

  // Build user section for settings popover
  const userSection = profile ? `
    <div class="settings-user">
      <div class="settings-user-avatar">${profile.smiley}</div>
      <div class="settings-user-info">
        <div class="settings-user-pseudo">${profile.pseudo}</div>
        <div class="settings-user-email">${profile.email}</div>
      </div>
    </div>
    <div class="settings-divider"></div>` : '';

  const profileLink = profile ? `
    <div class="settings-row settings-link-row" onclick="lw.go('profile')" style="cursor:pointer;">
      <span class="settings-row-label">👤 Edit Profile</span>
      <span class="settings-arrow">›</span>
    </div>` : '';

  const authRow = profile
    ? `<div class="settings-row settings-link-row settings-logout-row" onclick="lw.signOut()" style="cursor:pointer;">
         <span class="settings-row-label">🚪 Sign out</span>
       </div>`
    : `<div class="settings-row settings-link-row" onclick="lw.go('login')" style="cursor:pointer;">
         <span class="settings-row-label">🔑 Sign in</span>
       </div>`;

  // User button label (smiley or generic gear)
  const userBtnContent = profile
    ? `<span class="nav-user-smiley">${profile.smiley}</span><span class="nav-user-pseudo">${profile.pseudo}</span>`
    : `⚙`;

  nav.innerHTML = `
    <a class="nav-logo" href="#" onclick="event.preventDefault(); lw.go('home')">
      🎵 Lyric<span>Wise</span>
    </a>
    <div class="nav-links">
      <a class="${activePage === 'home'        ? 'active' : ''}" href="#" onclick="event.preventDefault(); lw.go('home')">Home</a>
      <a class="${activePage === 'stats'       ? 'active' : ''}" href="#" onclick="event.preventDefault(); lw.go('stats')">Stats</a>
      <a class="${activePage === 'leaderboard' ? 'active' : ''}" href="#" onclick="event.preventDefault(); lw.go('leaderboard')">🏆 Leaderboard</a>
      <a class="nav-cta${activePage === 'library' ? ' active' : ''}" href="#" onclick="event.preventDefault(); lw.go('library')">Browse Songs</a>
      <a class="nav-admin" href="#" onclick="event.preventDefault(); lw.go('admin')">Admin</a>
      <div style="position:relative;">
        <button class="nav-settings-btn${profile ? ' nav-user-btn' : ''}" id="settings-btn" title="Settings" onclick="lw.toggleSettings()">
          ${userBtnContent}
        </button>
        <div class="settings-popover" id="settings-popover" style="display:none;">
          <div class="settings-popover-title">Settings</div>
          ${userSection}
          <div class="settings-row">
            <span class="settings-row-label">☀️ Light mode</span>
            <label class="theme-toggle">
              <input type="checkbox" ${isLight ? 'checked' : ''} onchange="lw.toggleTheme()"/>
              <span class="theme-toggle-track"></span>
            </label>
          </div>
          ${profileLink}
          ${authRow}
        </div>
      </div>
    </div>
  `;
}

// ── Footer ────────────────────────────────────────────────────────

export function renderFooter() {
  const footer = document.getElementById('main-footer');
  if (!footer) return;
  footer.innerHTML = `
    <span class="footer-version">LyricWise v${APP_VERSION}</span>
  `;
}

// ── Global shortcut (used in onclick attributes in HTML) ──────────
window.lw = {
  go:            (page, params) => router.go(page, params),
  toggleTheme:   () => toggleTheme(),
  signOut:       async () => {
    // Dynamically import to avoid circular deps at load time
    const { logout } = await import('./auth.js');
    await logout();
    router.go('login');
  },
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

// ── Green smoke (Could You Be Loved) ─────────────────────────────

export function launchGreenSmoke() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const DURATION = 5000;
  const start    = performance.now();

  const particles = Array.from({ length: 55 }, () => ({
    x:     Math.random() * canvas.width,
    y:     canvas.height + Math.random() * 60,
    r:     Math.random() * 30 + 15,
    vx:    (Math.random() - 0.5) * 0.8,
    vy:    -(Math.random() * 1.2 + 0.4),
    alpha: Math.random() * 0.35 + 0.2,
    hue:   Math.random() * 50 + 95,   // 95–145 : vert jaunâtre → vert bleuté
    sat:   Math.random() * 40 + 25,
    lit:   Math.random() * 25 + 20,
    grow:  Math.random() * 0.25 + 0.08,
    phase: Math.random() * Math.PI * 2,
  }));

  let frame;
  function draw(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / DURATION, 1);
    const fade     = progress > 0.65 ? 1 - (progress - 0.65) / 0.35 : 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = 'blur(12px)';

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.lit}%, ${p.alpha * fade})`;
      ctx.fill();

      p.y  += p.vy;
      p.x  += p.vx + Math.sin(now / 900 + p.phase) * 0.4;
      p.r  += p.grow;

      if (p.y < -p.r * 2) {
        p.y    = canvas.height + 20;
        p.x    = Math.random() * canvas.width;
        p.r    = Math.random() * 30 + 15;
        p.alpha = Math.random() * 0.35 + 0.2;
      }
    });

    ctx.filter = 'none';

    if (progress < 1) {
      frame = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(frame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }

  frame = requestAnimationFrame(draw);
}
