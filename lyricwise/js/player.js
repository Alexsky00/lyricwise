// js/player.js
// Manages Spotify iFrame API and YouTube float window.
// Exported functions are called by pages/quiz.html

let spotifyController = null;
let activeTab         = 'spotify';
let youtubeLoaded     = false;
let spotifyLoaded     = false;

// ── Spotify ──────────────────────────────────────────────────────

export function loadSpotify(trackId, onPlaybackUpdate) {
  const el = document.getElementById('embed-spotify');
  if (!el) return;
  el.innerHTML = '<div id="spotify-api-embed"></div>';

  function initEmbed() {
    window.SpotifyIframeApi.createController(
      document.getElementById('spotify-api-embed'),
      { uri: `spotify:track:${trackId}`, width: '100%', height: 80, theme: 'dark' },
      ctrl => {
        spotifyController = ctrl;
        if (onPlaybackUpdate) {
          ctrl.addListener('playback_update', onPlaybackUpdate);
        }
      }
    );
  }

  if (window.SpotifyIframeApi) {
    initEmbed();
  } else {
    window.onSpotifyIframeApiReady = IFrameAPI => {
      window.SpotifyIframeApi = IFrameAPI;
      initEmbed();
    };
    if (!document.getElementById('spotify-iframe-api-script')) {
      const s   = document.createElement('script');
      s.id      = 'spotify-iframe-api-script';
      s.src     = 'https://open.spotify.com/embed/iframe-api/v1';
      s.async   = true;
      document.head.appendChild(s);
    }
  }
}

export function seek(seconds) {
  if (!spotifyController) return;
  spotifyController.resume();
  setTimeout(() => spotifyController.seek(seconds), 300);
}

export function stopSpotify() {
  const el = document.getElementById('embed-spotify');
  if (el) el.innerHTML = '';
  spotifyController = null;
  spotifyLoaded     = false;
}

// ── YouTube float window ─────────────────────────────────────────

export function openFloat(videoId, title, watchUrl) {
  const fp   = document.getElementById('float-player');
  const area = document.getElementById('float-video-area');
  const ttl  = document.getElementById('float-title-text');
  if (ttl) ttl.textContent = title || 'YouTube';

  area.innerHTML = '<div class="float-loading"><div class="float-loading-spinner"></div><p>Loading…</p></div>';
  fp.classList.add('visible');

  const fallbackUrl = watchUrl || `https://www.youtube.com/watch?v=${videoId}`;
  let errorShown    = false;

  function showError() {
    if (errorShown) return;
    errorShown = true;
    area.innerHTML = `
      <div class="float-embed-error">
        <div class="float-error-emoji">😅🎬</div>
        <div class="float-error-title">This video is a bit shy 🙈</div>
        <div class="float-error-msg">Embedding is disabled by the video owner.</div>
        <a class="float-error-btn" href="${fallbackUrl}" target="_blank" rel="noopener">▶ Watch on YouTube ↗</a>
      </div>`;
  }

  // Load YouTube iFrame API for error detection
  const tag       = document.createElement('script');
  tag.src         = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = () => {
    area.innerHTML = '<div id="yt-api-player"></div>';
    const player = new YT.Player('yt-api-player', {
      videoId,
      width: '100%', height: '100%',
      playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: () => {},
        onError: () => showError(),
      },
    });
    setTimeout(() => { if (!errorShown) {} }, 8000);
  };

  if (window.YT?.Player) window.onYouTubeIframeAPIReady();
}

export function closeFloat() {
  const fp = document.getElementById('float-player');
  if (fp) fp.classList.remove('visible');
  const area = document.getElementById('float-video-area');
  if (area) area.innerHTML = '';
}

export function stopAll() {
  stopSpotify();
  closeFloat();
  youtubeLoaded = false;
}

export function getActiveTab() { return activeTab; }
export function setActiveTab(tab) { activeTab = tab; }

// ── Float window drag ─────────────────────────────────────────────

(function initFloatDrag() {
  let dragging = false, offX = 0, offY = 0;

  function onStart(clientX, clientY) {
    const fp = document.getElementById('float-player');
    if (!fp) return;
    // Switch from bottom/right anchoring to absolute top/left
    const rect = fp.getBoundingClientRect();
    fp.style.right  = 'auto';
    fp.style.bottom = 'auto';
    fp.style.left   = rect.left + 'px';
    fp.style.top    = rect.top  + 'px';
    offX = clientX - rect.left;
    offY = clientY - rect.top;
    dragging = true;
    fp.style.transition = 'none';
    fp.style.userSelect = 'none';
  }

  function onMove(clientX, clientY) {
    if (!dragging) return;
    const fp = document.getElementById('float-player');
    if (!fp) return;
    const x = Math.max(0, Math.min(clientX - offX, window.innerWidth  - fp.offsetWidth));
    const y = Math.max(0, Math.min(clientY - offY, window.innerHeight - fp.offsetHeight));
    fp.style.left = x + 'px';
    fp.style.top  = y + 'px';
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    const fp = document.getElementById('float-player');
    if (fp) { fp.style.transition = ''; fp.style.userSelect = ''; }
  }

  // Attach once the DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.getElementById('float-titlebar');
    if (!bar) return;

    bar.addEventListener('mousedown', e => {
      if (e.target.closest('.float-controls')) return;
      e.preventDefault();
      onStart(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    document.addEventListener('mouseup',   onEnd);

    bar.addEventListener('touchstart', e => {
      if (e.target.closest('.float-controls')) return;
      e.preventDefault();
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    document.addEventListener('touchmove', e => {
      if (dragging) { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }
    }, { passive: false });
    document.addEventListener('touchend', onEnd);
  });
})();
