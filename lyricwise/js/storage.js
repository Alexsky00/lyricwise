// js/storage.js
// All localStorage access lives here.
// No other module should read/write localStorage directly.
//
// Scores are namespaced per user: lw_<uid>_<songId>_<level>
// Call setCurrentUserId(uid) after sign-in so all reads/writes use that user.

const BASE_PREFIX = 'lw_';

let _uid = null;

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

export function saveScore(songId, level, score, total) {
  const existing = getScore(songId, level);
  const isNewRecord = !existing || score > existing.best;
  const entry = {
    best:      isNewRecord ? score : existing.best,
    total,
    lastScore: score,
    playCount: (existing?.playCount || 0) + 1,
    updatedAt: Date.now(),
  };
  localStorage.setItem(key(songId, level), JSON.stringify(entry));
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
    const rest   = k.slice(userPrefix.length);   // e.g. "carry-on_A1"
    const sep    = rest.lastIndexOf('_');
    const songId = rest.slice(0, sep);
    const level  = rest.slice(sep + 1);
    if (!result[songId]) result[songId] = {};
    result[songId][level] = getScore(songId, level);
  }
  return result;
}

export function resetAll() {
  const userPrefix = prefix();
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(userPrefix)) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}
