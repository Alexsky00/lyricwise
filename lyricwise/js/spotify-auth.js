// js/spotify-auth.js
// Spotify OAuth 2.0 Authorization Code + PKCE (client-side only, no backend).
//
// SETUP:
//   1. Go to https://developer.spotify.com/dashboard and create an app.
//   2. In "Redirect URIs", add ONE entry for each environment:
//        http://127.0.0.1:5500/lyricwise/pages/spotify-callback.html   ← local dev
//        https://alexsky00.github.io/lyricwise/pages/spotify-callback.html  ← production
//   3. That's it — all pages share the same callback URL.

export const SPOTIFY_CLIENT_ID = '7ef4a246d4ab4a2ba2495d2f2e12f135';
const SCOPES = 'user-read-private user-read-email';

// ── PKCE helpers ──────────────────────────────────────────────────
function _generateVerifier() {
  const arr = new Uint8Array(64);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function _generateChallenge(verifier) {
  const data   = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/** Always points to the dedicated callback page — the only URI to register in Spotify. */
function _callbackUri() {
  const base = window.location.origin + window.location.pathname.replace(/\/[^/]+$/, '');
  return `${base}/spotify-callback.html`;
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Redirect the user to Spotify's auth page.
 * - returnTo : page to come back to after the callback (defaults to current page)
 * - stateKey / stateData : optional data to persist in sessionStorage across the redirect
 */
export async function startSpotifyAuth(returnTo = null, stateKey = null, stateData = null) {
  const verifier   = _generateVerifier();
  const challenge  = await _generateChallenge(verifier);
  const oauthState = crypto.randomUUID();

  console.info('[Spotify] Redirect URI to register in dashboard:', _callbackUri());

  sessionStorage.setItem('sp_verifier', verifier);
  sessionStorage.setItem('sp_state',    oauthState);
  sessionStorage.setItem('sp_return',   returnTo ?? window.location.href);
  if (stateKey && stateData !== null) {
    sessionStorage.setItem(stateKey, JSON.stringify(stateData));
  }

  const params = new URLSearchParams({
    client_id:             SPOTIFY_CLIENT_ID,
    response_type:         'code',
    redirect_uri:          _callbackUri(),
    scope:                 SCOPES,
    state:                 oauthState,
    code_challenge_method: 'S256',
    code_challenge:        challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

/**
 * Called by spotify-callback.html only.
 * Exchanges the ?code= for a token, fetches user info, cleans sessionStorage.
 * Returns { spotifyId, spotifyDisplayName, spotifyImage } or null on failure.
 */
export async function handleSpotifyCallback() {
  const params = new URLSearchParams(window.location.search);
  const code   = params.get('code');
  const state  = params.get('state');
  const error  = params.get('error');

  if (!code || error) return null;
  if (state !== sessionStorage.getItem('sp_state')) return null;

  const verifier = sessionStorage.getItem('sp_verifier');

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     SPOTIFY_CLIENT_ID,
      grant_type:    'authorization_code',
      code,
      redirect_uri:  _callbackUri(),
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) return null;
  const { access_token } = await tokenRes.json();

  const userRes = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) return null;
  const me = await userRes.json();

  sessionStorage.removeItem('sp_verifier');
  sessionStorage.removeItem('sp_state');

  return {
    spotifyId:          me.id,
    spotifyDisplayName: me.display_name || me.id,
    spotifyImage:       me.images?.[0]?.url ?? null,
  };
}

/**
 * Called by profile.html and login.html on page load.
 * If spotify-callback.html stored a result in sessionStorage, consumes and returns it.
 */
export function consumeSpotifyResult() {
  const raw = sessionStorage.getItem('sp_result');
  if (!raw) return null;
  sessionStorage.removeItem('sp_result');
  try { return JSON.parse(raw); } catch { return null; }
}
