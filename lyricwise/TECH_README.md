# LyricWise

Learn English through music — quiz yourself on real song lyrics at 5 CEFR levels.

## Live app
https://alexsky00.github.io/lyricwise/

---

## Local development (VS Code + Live Server)

1. Open the `lyricwise` folder in VS Code
2. Install the **Live Server** extension (search in Extensions panel)
3. Right-click `index.html` → **Open with Live Server**
4. The app opens at `http://127.0.0.1:5500`

> ⚠️ Do NOT open `index.html` by double-clicking — ES modules require an HTTP server.

---

## Project structure

```
lyricwise/
├── index.html               ← entry point (redirects to home)
├── css/
│   └── style.css            ← all styles
├── pages/
│   ├── home.html
│   ├── library.html
│   ├── quiz.html
│   ├── stats.html
│   ├── leaderboard.html     ← global ranking
│   ├── admin.html
│   ├── login.html
│   ├── profile.html
│   └── spotify-callback.html  ← OAuth redirect URI
├── js/
│   ├── router.js            ← navigation between pages
│   ├── firebase-db.js       ← centralised Firestore db export
│   ├── firebase-config.js   ← Firebase credentials
│   ├── catalogue.js         ← Firestore read/write + 5-min cache
│   ├── migration-data.js    ← static data imports for one-shot migration
│   ├── auth.js              ← Firebase Auth + Firestore profile
│   ├── storage.js           ← scores (localStorage cache + Firestore) + leaderboard
│   ├── spotify-auth.js      ← OAuth 2.0 PKCE
│   ├── quiz.js              ← quiz state (init receives questions as param)
│   ├── player.js            ← Spotify + YouTube embeds
│   ├── ui.js                ← nav, confetti, launchGreenSmoke, version
│   └── seek.js              ← excerpt seek helper
└── data/                    ← legacy static JS files (kept for reference)
    ├── index.js
    ├── songs/
    ├── lyrics/
    └── quizzes/
```

---

## Firestore data model

```
songs/{songId}
  id, title, artist, icon, youtubeId, spotifyId
  lyrics          ← full lyrics text
  availableLevels ← ["A1", "A2", ...]
  hasLyrics, comingSoon, createdAt, updatedAt

  quizzes/{level}
    songId, level, updatedAt
    questions: [{ lyrics, question, options[4], correct, timestamp, feedback }]

users/{uid}
  uid, email, username, pseudo, smiley, createdAt
  spotifyId, spotifyDisplayName, spotifyImage  ← if linked

  scores/{songId}
    A1: { best, total, lastScore, playCount, updatedAt }
    A2: ...

leaderboard/{uid}
  pseudo, smiley
  totalQuizzes, levelsCompleted, perfectScores, avgPct
  updatedAt
```

---

## Adding a new song

1. Open `pages/admin.html` in the browser
2. **✨ Add Song** tab — fill in title, artist, YouTube/Spotify IDs, icon
3. Paste lyrics → **✨ Generate quiz with AI** → copy prompt into Claude
4. Paste Claude's JSON response → **Import**
5. Click **☁ Save song to Firestore** then **☁ Save quiz to Firestore**

The song appears in the library immediately (5-min cache may delay it — reload to force).

---

## Editing an existing quiz

1. Open `pages/admin.html`
2. **✏️ Edit Quiz** tab → select song + level → edit question cards
3. **☁ Save to Firestore**

---

## Editing timestamps

1. Open `pages/admin.html`
2. **⏱ Timestamps** tab → select song + level
3. Edit `mm` / `sec` fields — use **♫ Open in Spotify** to listen while calibrating
4. **☁ Save timestamps to Firestore**

---

## Checking excerpt/lyrics alignment

1. Open `pages/admin.html`
2. **🔍 Lyrics** tab → select song + level
3. Each excerpt shows a live badge: `✅ Exact` / `~✅ Fuzzy` / `❌ Not found`
4. Edit the excerpt or the full lyrics directly, then save each independently

### Excerpt matching rules

The `highlightLyricsExcerpt()` function searches the full lyrics for each question's excerpt.
Two failure modes to avoid:

1. **Character mismatch** — excerpt must be an exact substring of the lyrics string (same quotes, same punctuation)
2. **Non-adjacent lines** — regex tolerates ≤ 6 chars between lines; non-consecutive lines fail silently

---

## Scores & leaderboard

Scores use a **hybrid localStorage + Firestore** strategy:
- Reads are always sync from localStorage cache
- Writes fire-and-forget to `users/{uid}/scores/{songId}` in Firestore
- On login, `loadScoresFromFirestore(uid)` hydrates the cache
- After every `saveScore`, the `leaderboard/{uid}` document is updated automatically
- `resetAll()` clears both localStorage and Firestore (scores + leaderboard entry)

---

## Firestore security rules

File: `firestore.rules` (repo root)

| Collection | Read | Write |
|---|---|---|
| `songs`, `songs/*/quizzes/*` | Any authenticated user | Admin only (`roux.alexis25@gmail.com`) |
| `users/{uid}`, `users/{uid}/scores/*` | Owner only | Owner only |
| `leaderboard/{uid}` | Any authenticated user | Owner only |

Deploy after any change:
```bash
firebase deploy --only firestore:rules --project lyricwise-e8fe5
```

---

## Spotify account linking

Flow uses **OAuth 2.0 PKCE** — no backend required.

1. Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Add redirect URIs:
   ```
   http://127.0.0.1:5500/lyricwise/pages/spotify-callback.html
   https://alexsky00.github.io/lyricwise/pages/spotify-callback.html
   ```
3. Client ID is in `js/spotify-auth.js` → `SPOTIFY_CLIENT_ID`

```
profile.html / login.html
  └─ startSpotifyAuth(returnTo)
       └─ Spotify consent screen
            └─ pages/spotify-callback.html
                 ├─ handleSpotifyCallback()
                 ├─ sessionStorage ← sp_result
                 └─ redirect → returnTo
                      └─ consumeSpotifyResult()
                           └─ updateProfile({ spotifyId, ... })
```

---

## Authentication (Firebase)

- All pages call `await requireAuth()` — unauthenticated users → `login.html`
- Profile cached in `localStorage` (`lw_profile_cache`) for sync nav rendering
- `auth.js` calls `setCurrentUserProfile(profile)` on login to enable leaderboard updates

### Key exports from `js/auth.js`

| Export | Usage |
|---|---|
| `requireAuth()` | Protected pages |
| `checkAuth()` | Login page only |
| `register({email, password, username, pseudo, smiley})` | Create account |
| `login(email, password)` | Sign in |
| `logout()` | Sign out |
| `updateProfile(changes)` | Patch Firestore + cache |
| `changePassword(currentPw, newPw)` | Re-auth then update |

---

## App version

Defined in `js/ui.js`:

```js
export const APP_VERSION = '1.9-Alpha';
```

Displayed in the footer of every page and the admin badge.

---

## Deploy to GitHub Pages

```bash
git add .
git commit -m "describe your change"
git push
```

Published automatically to `https://alexsky00.github.io/lyricwise/`
