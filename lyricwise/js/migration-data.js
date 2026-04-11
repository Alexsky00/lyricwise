// js/migration-data.js
// One-shot migration helper — imports all static data files and exposes them
// as a structured array for the "Migrate to Firestore" admin function.
// Delete this file after migration is confirmed.

import { song as carryOn,         } from '../data/songs/carry-on.js';
import { lyrics as carryOnLyrics  } from '../data/lyrics/carry-on-lyrics.js';
import { quiz as carryOnQuiz      } from '../data/quizzes/carry-on-quiz.js';

import { song as onAndOn          } from '../data/songs/on-and-on.js';
import { lyrics as onAndOnLyrics  } from '../data/lyrics/on-and-on-lyrics.js';
import { quiz as onAndOnQuiz      } from '../data/quizzes/on-and-on-quiz.js';

import { song as heroesTonight        } from '../data/songs/heroes-tonight.js';
import { lyrics as heroesTonightLyrics} from '../data/lyrics/heroes-tonight-lyrics.js';
import { quiz as heroesTonightQuiz    } from '../data/quizzes/heroes-tonight-quiz.js';

import { song as standByMe        } from '../data/songs/stand-by-me.js';
import { lyrics as standByMeLyrics} from '../data/lyrics/stand-by-me-lyrics.js';
import { quiz as standByMeQuiz    } from '../data/quizzes/stand-by-me-quiz.js';

import { song as carelessWhisper        } from '../data/songs/careless-whisper.js';
import { lyrics as carelessWhisperLyrics} from '../data/lyrics/careless-whisper-lyrics.js';
import { quiz as carelessWhisperQuiz    } from '../data/quizzes/careless-whisper-quiz.js';

import { song as words        } from '../data/songs/words.js';
import { lyrics as wordsLyrics} from '../data/lyrics/words-lyrics.js';
import { quiz as wordsQuiz    } from '../data/quizzes/words-quiz.js';

import { song as couldYouBeLoved        } from '../data/songs/could-you-be-loved.js';
import { lyrics as couldYouBeLovedLyrics} from '../data/lyrics/could-you-be-loved-lyrics.js';
import { quiz as couldYouBeLovedQuiz    } from '../data/quizzes/could-you-be-loved-quiz.js';

import { song as starships        } from '../data/songs/starships.js';
import { lyrics as starshipsLyrics} from '../data/lyrics/starships-lyrics.js';

export const MIGRATION_DATA = [
  { song: carryOn,         lyrics: carryOnLyrics,         quiz: carryOnQuiz         },
  { song: onAndOn,         lyrics: onAndOnLyrics,         quiz: onAndOnQuiz         },
  { song: heroesTonight,   lyrics: heroesTonightLyrics,   quiz: heroesTonightQuiz   },
  { song: standByMe,       lyrics: standByMeLyrics,       quiz: standByMeQuiz       },
  { song: carelessWhisper, lyrics: carelessWhisperLyrics, quiz: carelessWhisperQuiz },
  { song: words,           lyrics: wordsLyrics,           quiz: wordsQuiz           },
  { song: couldYouBeLoved, lyrics: couldYouBeLovedLyrics, quiz: couldYouBeLovedQuiz },
  { song: starships,       lyrics: starshipsLyrics,       quiz: {}                  },
];
