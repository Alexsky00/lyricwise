// data/index.js
// The single source of truth for all songs.
// To add a song:
//   1. Create data/songs/my-song.js
//   2. Create data/lyrics/my-song-lyrics.js
//   3. Create data/quizzes/my-song-quiz.js
//   4. Import and add it here

import { song as carryOn }       from './songs/carry-on.js';
import { quiz as carryOnQuiz }   from './quizzes/carry-on-quiz.js';
import { lyrics as carryOnLyrics } from './lyrics/carry-on-lyrics.js';

import { song as onAndOn }       from './songs/on-and-on.js';
import { quiz as onAndOnQuiz }   from './quizzes/on-and-on-quiz.js';
import { lyrics as onAndOnLyrics } from './lyrics/on-and-on-lyrics.js';

import { song as heroesTonight }     from './songs/heroes-tonight.js';
import { quiz as heroesTonightQuiz } from './quizzes/heroes-tonight-quiz.js';
import { lyrics as heroesTonightLyrics } from './lyrics/heroes-tonight-lyrics.js';

import { song as standByMe }     from './songs/stand-by-me.js';
import { quiz as standByMeQuiz } from './quizzes/stand-by-me-quiz.js';
import { lyrics as standByMeLyrics } from './lyrics/stand-by-me-lyrics.js';

import { song as carelessWhisper }     from './songs/careless-whisper.js';
import { quiz as carelessWhisperQuiz } from './quizzes/careless-whisper-quiz.js';
import { lyrics as carelessWhisperLyrics } from './lyrics/careless-whisper-lyrics.js';

import { song as words }     from './songs/words.js';
import { quiz as wordsQuiz } from './quizzes/words-quiz.js';
import { lyrics as wordsLyrics } from './lyrics/words-lyrics.js';

import { song as starships } from './songs/starships.js';
import { lyrics as starshipsLyrics } from './lyrics/starships-lyrics.js';

// catalogue: array of song objects, each with its quiz and lyrics attached
export const catalogue = [
  { ...carryOn,         quiz: carryOnQuiz,         lyrics: carryOnLyrics },
  { ...onAndOn,         quiz: onAndOnQuiz,         lyrics: onAndOnLyrics },
  { ...heroesTonight,   quiz: heroesTonightQuiz,   lyrics: heroesTonightLyrics },
  { ...standByMe,       quiz: standByMeQuiz,       lyrics: standByMeLyrics },
  { ...carelessWhisper, quiz: carelessWhisperQuiz, lyrics: carelessWhisperLyrics },
  { ...words,           quiz: wordsQuiz,           lyrics: wordsLyrics },
  { ...starships,                                  lyrics: starshipsLyrics },
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
