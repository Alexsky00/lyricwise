// js/quiz.js
// Manages quiz state and rendering.
// Supports question types: mcq, match, tf, fill (+ legacy mcq without type field).

import { saveScore } from './storage.js';

let state = {
  song:      null,
  level:     null,
  questions: [],
  current:   0,
  score:     0,
  answered:  false,
};

// ── Type enrichment ───────────────────────────────────────────────

/**
 * Converts raw Firestore questions into engine-ready format:
 *  - match  → options[] built from sibling definitions; correct = index
 *  - tf     → options: ['True','False']; correct: 0 or 1
 *  - mcq    → Fisher-Yates shuffle on options
 *  - fill   → unchanged (answer compared as string)
 */
function _prepareQuestions(rawQuestions) {
  const qs = rawQuestions.map(q => ({ ...q }));

  // 1. Match: group by section+exercise, share shuffled definitions as options
  const matchGroups = {};
  qs.forEach((q, i) => {
    if (q.type === 'match') {
      const key = `${q.section ?? ''}:${q.exercise ?? ''}`;
      (matchGroups[key] ??= []).push(i);
    }
  });
  Object.values(matchGroups).forEach(indices => {
    const defs     = indices.map(i => qs[i].definition);
    const shuffled = [...defs].sort(() => Math.random() - 0.5);
    indices.forEach(i => {
      const q    = qs[i];
      q.options  = shuffled;
      q.correct  = shuffled.indexOf(q.definition);
      q.question ??= `What does "${q.term}" mean?`;
    });
  });

  // 2. TF: convert to 2-option MCQ
  qs.forEach(q => {
    if (q.type === 'tf') {
      q.options = ['True', 'False'];
      q.correct = q.correct === true ? 0 : 1;
    }
  });

  // 3. MCQ only: shuffle options (legacy questions without type also treated as mcq)
  return qs.map(q => (q.type === 'mcq' || !q.type) ? _shuffleOptions(q) : q);
}

function _shuffleOptions(question) {
  const n = question.options?.length ?? 0;
  if (!n) return question;
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return {
    ...question,
    options: idx.map(i => question.options[i]),
    correct: idx.indexOf(question.correct),
  };
}

// ── Public API ────────────────────────────────────────────────────

export function init(song, level, questions) {
  if (!questions || questions.length === 0) {
    console.error(`[quiz] No questions for ${song.id} / ${level}`);
    return false;
  }
  state = {
    song,
    level,
    questions: _prepareQuestions(questions),
    current:   0,
    score:     0,
    answered:  false,
  };
  return true;
}

export function getState()           { return { ...state }; }
export function getCurrentQuestion() { return state.questions[state.current] || null; }

export function getProgress() {
  return { current: state.current + 1, total: state.questions.length, score: state.score };
}

/**
 * Submit an answer.
 *   mcq / match / tf  → input is the selected option index (number)
 *   fill              → input is the typed or bank-selected string
 * Returns { correct, feedback } or null if already answered.
 */
export function answer(input) {
  if (state.answered) return null;
  state.answered = true;

  const q = getCurrentQuestion();
  let correct;

  if (q.type === 'fill') {
    const given    = String(input).trim().toLowerCase();
    const expected = String(q.correct).trim().toLowerCase();
    correct = given === expected;
  } else {
    correct = Number(input) === q.correct;
  }

  if (correct) state.score++;
  return { correct, feedback: q.feedback ?? '' };
}

/** Advance to next question. Returns { done, ... }. */
export function next() {
  if (state.current >= state.questions.length - 1) {
    const isNewRecord = saveScore(
      state.song.id, state.level, state.score, state.questions.length
    );
    return { done: true, isNewRecord, score: state.score, total: state.questions.length };
  }
  state.current++;
  state.answered = false;
  return { done: false };
}

export function getTimestamp() {
  return getCurrentQuestion()?.timestamp ?? 0;
}
