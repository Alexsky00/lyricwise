// data/index.js
// The single source of truth for all songs.
// To add a song:
//   1. Create data/songs/my-song.js
//   2. Create data/quizzes/my-song.js
//   3. Import and add it here

import { song as carryOn }       from './songs/carry-on.js';
import { quiz as carryOnQuiz }   from './quizzes/carry-on-quiz.js';

import { song as onAndOn }       from './songs/on-and-on.js';
import { quiz as onAndOnQuiz }   from './quizzes/on-and-on-quiz.js';

import { song as heroesTonight }     from './songs/heroes-tonight.js';
import { quiz as heroesTonightQuiz } from './quizzes/heroes-tonight-quiz.js';

import { song as standByMe } from './songs/stand-by-me.js';
import { quiz as standByMeQuiz } from './quizzes/stand-by-me-quiz.js';

import { song as carelessWhisper }     from './songs/careless-whisper.js';
import { quiz as carelessWhisperQuiz } from './quizzes/careless-whisper-quiz.js';

import { song as words } from './songs/words.js';
import { quiz as wordsQuiz } from './quizzes/words-quiz.js';

import { song as starships } from './songs/starships.js';

// catalogue: array of song objects, each with its quiz attached
export const catalogue = [
  { ...carryOn,       quiz: carryOnQuiz },
  { ...onAndOn,       quiz: onAndOnQuiz },
  { ...heroesTonight, quiz: heroesTonightQuiz },
  { ...standByMe, quiz: standByMeQuiz},
  { ...carelessWhisper, quiz: carelessWhisperQuiz },
  { ...words, quiz: wordsQuiz },
  { ...starships },
];

// Helper: get one song by id
export function getSong(id) {
  return catalogue.find(s => s.id === id) || null;
}

// Helper: check if a level has questions
export function hasQuiz(songId, level) {
  const song = getSong(songId);
  return Array.isArray(song?.quiz?.[level]) && song.quiz[level].length > 0;
}
