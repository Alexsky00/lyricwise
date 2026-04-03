// js/seek.js
// Excerpt seek helper: the ? button on each quiz question.
// Depends on player.js for seek().

import { seek, getActiveTab } from './player.js';

export function renderSeekHelper(timestamp) {
  document.querySelector('.excerpt-help-btn')?.remove();
  document.querySelector('.excerpt-popover')?.remove();

  const box = document.querySelector('.quiz-lyrics-box');
  if (!box) return;

  const btn   = document.createElement('button');
  btn.className = 'excerpt-help-btn';
  btn.title     = 'Listen to this part of the song';
  btn.textContent = '?';
  btn.onclick = e => { e.stopPropagation(); togglePopover(timestamp); };
  box.appendChild(btn);
}

function togglePopover(timestamp) {
  const box = document.querySelector('.quiz-lyrics-box');
  const existing = document.querySelector('.excerpt-popover');
  if (existing) { existing.remove(); return; }

  const mins  = Math.floor(timestamp / 60);
  const secs  = String(timestamp % 60).padStart(2, '0');
  const label = `${mins}:${secs}`;
  const isSpotify = getActiveTab() === 'spotify';

  const pop = document.createElement('div');
  pop.className = 'excerpt-popover';

  if (isSpotify) {
    pop.innerHTML = `
      <div class="popover-title">🎵 Jump to this moment</div>
      <div class="popover-desc">Seek Spotify to <strong>${label}</strong> — where this excerpt appears.</div>
      <button class="seek-btn" id="seek-go-btn">▶ Go to ${label}</button>
      <div class="seek-yt-notice">⚠️ Seek only available on Spotify.</div>`;
  } else {
    pop.innerHTML = `
      <div class="popover-title">🎵 Jump to this moment</div>
      <div class="popover-desc">This excerpt is around <strong>${label}</strong>.</div>
      <div class="seek-yt-notice">⚠️ Switch to Spotify tab to use seek.</div>`;
  }

  box.appendChild(pop);

  if (isSpotify) {
    document.getElementById('seek-go-btn')?.addEventListener('click', () => {
      seek(timestamp);
      pop.remove();
    });
  }

  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('click', handler); }
    });
  }, 0);
}
