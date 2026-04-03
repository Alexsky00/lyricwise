// js/storage.js
// All localStorage access lives here.
// No other module should read/write localStorage directly.

const PREFIX = 'lw_';

function key(songId, level) {
  return `${PREFIX}${songId}_${level}`;
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
  const result = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k.startsWith(PREFIX)) continue;
    const rest = k.slice(PREFIX.length);          // e.g. "carry-on_A1"
    const sep  = rest.lastIndexOf('_');
    const songId = rest.slice(0, sep);
    const level  = rest.slice(sep + 1);
    if (!result[songId]) result[songId] = {};
    result[songId][level] = getScore(songId, level);
  }
  return result;
}

export function resetAll() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(PREFIX)) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}
