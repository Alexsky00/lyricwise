// js/auth.js
// Firebase Authentication + Firestore user profiles.
// All auth logic lives here — no other module touches Firebase directly.

import { initializeApp }                              from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword       as fbUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
}                                                      from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
}                                                      from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { firebaseConfig }                              from './firebase-config.js';
import { setCurrentUserId }                            from './storage.js';

// ── Firebase init ─────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── In-memory cache ───────────────────────────────────────────────
let _user    = null;   // Firebase Auth user  (null = signed out, undefined = not yet resolved)
let _profile = null;   // Firestore profile

// Wire up auth-state observer once at module load
const _authReady = new Promise(resolve => {
  onAuthStateChanged(auth, async (user) => {
    _user = user;
    if (user) {
      _profile = await _fetchProfile(user.uid);
      setCurrentUserId(user.uid);
      _cacheProfile(_profile);
    } else {
      _profile = null;
      setCurrentUserId(null);
      localStorage.removeItem('lw_profile_cache');
    }
    resolve({ user: _user, profile: _profile });
  });
});

// ── Firestore helpers ─────────────────────────────────────────────
async function _fetchProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

function _cacheProfile(profile) {
  if (!profile) return;
  // Cache only display fields so renderNav() can read them synchronously
  localStorage.setItem('lw_profile_cache', JSON.stringify({
    uid:      profile.uid,
    pseudo:   profile.pseudo,
    smiley:   profile.smiley,
    username: profile.username,
    email:    profile.email,
  }));
}

// ── Public getters ────────────────────────────────────────────────
export function getCurrentUser()    { return _user; }
export function getCurrentProfile() { return _profile; }

/** Read the locally-cached profile (sync, no Firestore call). */
export function getCachedProfile() {
  const raw = localStorage.getItem('lw_profile_cache');
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

// ── Auth actions ──────────────────────────────────────────────────

export async function register({ email, password, username, pseudo, smiley }) {
  const cred    = await createUserWithEmailAndPassword(auth, email, password);
  const uid     = cred.user.uid;
  const profile = { uid, email, username, pseudo, smiley, createdAt: Date.now() };
  await setDoc(doc(db, 'users', uid), profile);
  _profile = profile;
  setCurrentUserId(uid);
  _cacheProfile(profile);
  return cred.user;
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  _profile   = await _fetchProfile(cred.user.uid);
  setCurrentUserId(cred.user.uid);
  _cacheProfile(_profile);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

export async function updateProfile(changes) {
  if (!_user) throw new Error('Not logged in');
  await updateDoc(doc(db, 'users', _user.uid), changes);
  _profile = { ..._profile, ...changes };
  _cacheProfile(_profile);
  return _profile;
}

/**
 * Change password — requires current password for re-authentication.
 */
export async function changePassword(currentPassword, newPassword) {
  if (!_user) throw new Error('Not logged in');
  const credential = EmailAuthProvider.credential(_user.email, currentPassword);
  await reauthenticateWithCredential(_user, credential);
  await fbUpdatePassword(_user, newPassword);
}

// ── Auth guard ────────────────────────────────────────────────────

/**
 * Used on the login page only.
 * Waits for auth state, returns result WITHOUT redirecting.
 */
export async function checkAuth() {
  return _authReady;
}

/**
 * Call at the top of every protected page.
 * Waits for auth state to resolve, then either returns {user, profile}
 * or redirects to login.html.
 */
export async function requireAuth() {
  const result = await _authReady;
  if (!result.user) {
    // Determine correct path to login page
    const inPages = window.location.pathname.includes('/pages/');
    window.location.href = inPages ? './login.html' : './pages/login.html';
    // Pause execution while redirect happens
    await new Promise(() => {});
  }
  return result;
}
