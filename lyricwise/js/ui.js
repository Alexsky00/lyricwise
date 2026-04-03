// js/ui.js
// Shared UI utilities: navigation bar, confetti, toast messages.

import { router } from './router.js';

// ── Nav ──────────────────────────────────────────────────────────
// Call renderNav('library') to highlight the active link.

export function renderNav(activePage) {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  nav.innerHTML = `
    <a class="nav-logo" href="#" onclick="event.preventDefault(); lw.go('home')">
      🎵 Lyric<span>Wise</span>
    </a>
    <div class="nav-links">
      <a class="${activePage === 'home'  ? 'active' : ''}" href="#" onclick="event.preventDefault(); lw.go('home')">Home</a>
      <a class="${activePage === 'stats' ? 'active' : ''}" href="#" onclick="event.preventDefault(); lw.go('stats')">Stats</a>
      <a class="nav-cta${activePage === 'library' ? ' active' : ''}" href="#" onclick="event.preventDefault(); lw.go('library')">Browse Songs</a>
      <a class="nav-admin" href="#" onclick="event.preventDefault(); lw.go('admin')" title="Admin">⚙</a>
    </div>
  `;
}

// ── Global shortcut (used in onclick attributes in HTML) ──────────
// Makes lw.go('library') work from inline HTML onclick handlers.
window.lw = { go: (page, params) => router.go(page, params) };

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
