// js/catalogue.js
// Replaces data/index.js — all song/quiz data is read from Firestore.
// All public functions are async. Results are cached in-memory for 5 min.

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  orderBy,
}                from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { db }    from './firebase-db.js';

// ── In-memory cache ───────────────────────────────────────────────
const CATALOGUE_TTL = 5 * 60 * 1000; // 5 min

const _cache = {
  catalogue:         null,
  catalogueFetchedAt: 0,
  quizzes:           new Map(), // key: "songId:level"
};

export function invalidateCache() {
  _cache.catalogue          = null;
  _cache.catalogueFetchedAt = 0;
  _cache.quizzes.clear();
}

// ── Read — catalogue ──────────────────────────────────────────────

/** Returns all songs (without quiz questions). Cached 5 min. */
export async function getCatalogue() {
  const now = Date.now();
  if (_cache.catalogue && now - _cache.catalogueFetchedAt < CATALOGUE_TTL) {
    return _cache.catalogue;
  }
  try {
    const snap = await getDocs(query(collection(db, 'songs'), orderBy('createdAt')));
    _cache.catalogue          = snap.docs.map(d => d.data());
    _cache.catalogueFetchedAt = now;
    return _cache.catalogue;
  } catch (err) {
    console.error('[catalogue] getCatalogue failed', err);
    return _cache.catalogue ?? [];
  }
}

/** Returns one song by id (without questions). Uses cache if available. */
export async function getSong(id) {
  if (_cache.catalogue) {
    const hit = _cache.catalogue.find(s => s.id === id);
    if (hit) return hit;
  }
  try {
    const snap = await getDoc(doc(db, 'songs', id));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error('[catalogue] getSong failed', err);
    return null;
  }
}

/**
 * Returns true if the song has questions for this level.
 * Reads from song.availableLevels — no extra Firestore call.
 * Pass the song object directly when you already have it.
 */
export function hasQuizSync(song, level) {
  return Array.isArray(song?.availableLevels) && song.availableLevels.includes(level);
}

/** Async version — fetches the song first if needed. */
export async function hasQuiz(songId, level) {
  const song = await getSong(songId);
  return hasQuizSync(song, level);
}

/** Returns the questions array for a level. Cached per "songId:level". */
export async function getQuizQuestions(songId, level) {
  const key = `${songId}:${level}`;
  if (_cache.quizzes.has(key)) return _cache.quizzes.get(key);
  try {
    const snap = await getDoc(doc(db, 'songs', songId, 'quizzes', level));
    if (!snap.exists()) return null;
    const questions = snap.data().questions ?? [];
    _cache.quizzes.set(key, questions);
    return questions;
  } catch (err) {
    console.error('[catalogue] getQuizQuestions failed', err);
    return null;
  }
}

/** Returns { song, questions } in a single Promise.all. */
export async function getSongWithQuiz(songId, level) {
  const [song, questions] = await Promise.all([
    getSong(songId),
    getQuizQuestions(songId, level),
  ]);
  if (!song || !questions) return null;
  return { song, questions };
}

// ── Write — admin only ────────────────────────────────────────────

/** Creates or updates a song document (no quiz, no lyrics). */
export async function saveSong(songData) {
  const now  = Date.now();
  const data = {
    ...songData,
    updatedAt: now,
    createdAt: songData.createdAt ?? now,
    availableLevels: songData.availableLevels ?? [],
    comingSoon:      songData.comingSoon      ?? false,
    hasLyrics:       typeof songData.lyrics === 'string' && songData.lyrics.trim().length > 0,
  };
  await setDoc(doc(db, 'songs', songData.id), data, { merge: true });
  invalidateCache();
}

/** Updates the lyrics field of a song document. */
export async function saveLyrics(songId, lyrics) {
  await updateDoc(doc(db, 'songs', songId), {
    lyrics,
    hasLyrics: typeof lyrics === 'string' && lyrics.trim().length > 0,
    updatedAt: Date.now(),
  });
  invalidateCache();
}

/**
 * Saves quiz questions for one level.
 * Uses a batch to atomically update both the subcollection document
 * and availableLevels in the parent song document.
 */
export async function saveQuizLevel(songId, level, questions) {
  const batch    = writeBatch(db);
  const quizRef  = doc(db, 'songs', songId, 'quizzes', level);
  const songRef  = doc(db, 'songs', songId);
  const now      = Date.now();

  batch.set(quizRef, { level, songId, questions, updatedAt: now }, { merge: true });

  // Atomically add level to availableLevels and update quizSchema
  const songSnap   = await getDoc(songRef);
  const songData   = songSnap.exists() ? songSnap.data() : {};
  const existing   = songData.availableLevels ?? [];
  const merged     = Array.from(new Set([...existing, level])).sort();
  // Detect schema: v2 if any question has a 'type' field; v1 otherwise.
  // Once v2 is set it is never downgraded (a song can have mixed levels).
  const detectedSchema = questions.length > 0 && questions[0]?.type ? 'v2' : 'v1';
  const currentSchema  = songData.quizSchema ?? 'v1';
  const nextSchema     = (currentSchema === 'v2' || detectedSchema === 'v2') ? 'v2' : 'v1';
  batch.update(songRef, { availableLevels: merged, quizSchema: nextSchema, updatedAt: now });

  await batch.commit();
  _cache.quizzes.delete(`${songId}:${level}`);
  invalidateCache();
}

/** Removes a quiz level from Firestore and from availableLevels. */
export async function deleteQuizLevel(songId, level) {
  const batch   = writeBatch(db);
  const quizRef = doc(db, 'songs', songId, 'quizzes', level);
  const songRef = doc(db, 'songs', songId);

  batch.delete(quizRef);

  const songSnap = await getDoc(songRef);
  if (songSnap.exists()) {
    const filtered = (songSnap.data().availableLevels ?? []).filter(l => l !== level);
    batch.update(songRef, { availableLevels: filtered, updatedAt: Date.now() });
  }
  await batch.commit();
  _cache.quizzes.delete(`${songId}:${level}`);
  invalidateCache();
}
