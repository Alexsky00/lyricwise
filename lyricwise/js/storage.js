// js/storage.js
// Quiz score management — localStorage as primary cache, Firestore as persistent store.
// Sync reads (getScore, getAllScores, hasAnyScore) read from the local cache.
// Writes (saveScore) update the cache and fire-and-forget to Firestore.
// Call loadScoresFromFirestore(uid) on login to hydrate the cache from Firestore.

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { db } from './firebase-db.js';

const BASE_PREFIX = 'lw_';

let _uid     = null;
let _profile = null;

/** Called by auth.js after profile is fetched. */
export function setCurrentUserProfile(profile) {
  _profile = profile;
}

/** Called by auth.js after sign-in / sign-out. */
export function setCurrentUserId(uid) {
  _uid = uid;
}

function prefix() {
  return _uid ? `${BASE_PREFIX}${_uid}_` : BASE_PREFIX;
}

function key(songId, level) {
  return `${prefix()}${songId}_${level}`;
}

// ── Firestore helpers ─────────────────────────────────────────────

/**
 * Hydrates the localStorage cache from Firestore.
 * Called once after login — subsequent reads are sync from cache.
 */
export async function loadScoresFromFirestore(uid) {
  if (!uid) return;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'scores'));
    snap.docs.forEach(d => {
      const songId = d.id;
      Object.entries(d.data()).forEach(([level, entry]) => {
        localStorage.setItem(`${BASE_PREFIX}${uid}_${songId}_${level}`, JSON.stringify(entry));
      });
    });
  } catch (err) {
    console.warn('[storage] loadScoresFromFirestore failed', err);
  }
}

// ── Score read/write ──────────────────────────────────────────────

export function saveScore(songId, level, score, total) {
  const existing   = getScore(songId, level);
  const isNewRecord = !existing || score > existing.best;
  const entry = {
    best:      isNewRecord ? score : existing.best,
    total,
    lastScore: score,
    playCount: (existing?.playCount || 0) + 1,
    updatedAt: Date.now(),
  };

  // Update localStorage cache (sync)
  localStorage.setItem(key(songId, level), JSON.stringify(entry));

  // Persist to Firestore (async, fire-and-forget)
  if (_uid) {
    setDoc(
      doc(db, 'users', _uid, 'scores', songId),
      { [level]: entry },
      { merge: true }
    ).catch(err => console.warn('[storage] saveScore Firestore failed', err));

    _updateLeaderboard();
  }

  return isNewRecord;
}

export function getScore(songId, level) {
  const raw = localStorage.getItem(key(songId, level));
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

export function hasAnyScore(songId) {
  return ['A1', 'A2', 'B1', 'B2', 'C1'].some(l => getScore(songId, l));
}

export function getAllScores() {
  const userPrefix = prefix();
  const result = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k.startsWith(userPrefix)) continue;
    const rest   = k.slice(userPrefix.length);
    const sep    = rest.lastIndexOf('_');
    const songId = rest.slice(0, sep);
    const level  = rest.slice(sep + 1);
    if (!result[songId]) result[songId] = {};
    result[songId][level] = getScore(songId, level);
  }
  return result;
}

/**
 * Clears all scores — localStorage + Firestore + leaderboard entry.
 * Returns a Promise (await it before re-rendering).
 */
export async function resetAll() {
  // Clear localStorage cache
  const userPrefix = prefix();
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(userPrefix)) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  // Clear Firestore scores + leaderboard
  if (_uid) {
    try {
      const snap = await getDocs(collection(db, 'users', _uid, 'scores'));
      await Promise.all([
        ...snap.docs.map(d => deleteDoc(d.ref)),
        deleteDoc(doc(db, 'leaderboard', _uid)),
      ]);
    } catch (err) {
      console.warn('[storage] resetAll Firestore failed', err);
    }
  }
}

// ── Leaderboard ───────────────────────────────────────────────────

function _updateLeaderboard() {
  if (!_uid || !_profile) return;
  const scores = getAllScores();
  let totalQuizzes = 0, levelsCompleted = 0, perfectScores = 0, pctSum = 0;

  Object.values(scores).forEach(songScores => {
    Object.values(songScores).forEach(d => {
      if (!d) return;
      totalQuizzes   += d.playCount || 1;
      levelsCompleted++;
      const pct = d.best / d.total;
      if (pct === 1) perfectScores++;
      pctSum += pct;
    });
  });

  const avgPct = levelsCompleted > 0 ? Math.round((pctSum / levelsCompleted) * 100) : 0;

  setDoc(doc(db, 'leaderboard', _uid), {
    pseudo:          _profile.pseudo,
    smiley:          _profile.smiley,
    totalQuizzes,
    levelsCompleted,
    perfectScores,
    avgPct,
    updatedAt:       Date.now(),
  }).catch(err => console.warn('[storage] leaderboard update failed', err));
}
