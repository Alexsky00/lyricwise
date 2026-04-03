// js/quiz.js
// Manages quiz state and rendering.
// Called by pages/quiz.html

import { saveScore } from './storage.js';

let state = {
  song:     null,   // full song object with quiz data
  level:    null,
  questions: [],
  current:  0,
  score:    0,
  answered: false,
};

export function init(song, level) {
  const questions = song.quiz?.[level];
  if (!questions || questions.length === 0) {
    console.error(`[quiz] No questions for ${song.id} / ${level}`);
    return false;
  }
  state = {
    song,
    level,
    questions,
    current:  0,
    score:    0,
    answered: false,
  };
  return true;
}

export function getState() {
  return { ...state };
}

export function getCurrentQuestion() {
  return state.questions[state.current] || null;
}

export function getProgress() {
  return {
    current: state.current + 1,
    total:   state.questions.length,
    score:   state.score,
  };
}

// Returns { correct: bool, feedback: string, isNewRecord: bool|null }
export function answer(optionIndex) {
  if (state.answered) return null;
  state.answered = true;

  const q       = getCurrentQuestion();
  const correct = optionIndex === q.correct;
  if (correct) state.score++;

  let isNewRecord = null;
  const isLast = state.current === state.questions.length - 1;
  if (isLast && correct) {
    // Save when we know final score (called again in next() for last question)
  }

  return { correct, feedback: q.feedback };
}

// Advance to next question. Returns true if there is one, false if quiz is done.
export function next() {
  if (state.current >= state.questions.length - 1) {
    // Save final score
    const isNewRecord = saveScore(
      state.song.id,
      state.level,
      state.score,
      state.questions.length
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
