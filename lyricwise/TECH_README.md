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
│   ├── admin.html
│   ├── login.html           ← sign-in / register page
│   └── profile.html         ← edit pseudo, avatar, password
├── js/
│   ├── router.js            ← navigation between pages
│   ├── quiz.js              ← quiz state and logic
│   ├── player.js            ← Spotify + YouTube embeds
│   ├── storage.js           ← localStorage (scores, per-user namespaced)
│   ├── ui.js                ← nav, confetti, toast
│   ├── seek.js              ← excerpt seek helper
│   ├── auth.js              ← Firebase Auth + Firestore profile logic
│   └── firebase-config.js   ← Firebase project credentials (fill before deploy)
└── data/
    ├── index.js             ← assembles all songs — edit this to add a song
    ├── songs/               ← one file per song (metadata only)
    ├── lyrics/              ← one file per song (full lyrics text)
    └── quizzes/             ← one file per song (questions only)
```

---

## Adding a new song

### Option A — Admin page (recommended)

1. Open `pages/admin.html` in the browser
2. Fill in the song info (title, artist, YouTube/Spotify IDs, icon)
3. Paste the full lyrics and click **✨ Generate quiz with AI →** — copy the prompt into Claude
4. Paste Claude's JSON response back into the modal and click **Import**
5. Download the **three** generated files:
   - `songs/[slug].js`
   - `lyrics/[slug]-lyrics.js`
   - `quizzes/[slug]-quiz.js`
6. Move them into their respective `data/` subfolders
7. Open `data/index.js` and add the import lines shown by the admin page
8. Push to GitHub

### Option B — Manual

1. Create `data/songs/my-song.js` (copy an existing one as template)
2. Create `data/lyrics/my-song-lyrics.js` — paste lyrics between the backticks
3. Create `data/quizzes/my-song-quiz.js` (copy an existing one as template)
4. Open `data/index.js` and add:
   ```js
   import { song as mySong }         from './songs/my-song.js';
   import { lyrics as mySongLyrics } from './lyrics/my-song-lyrics.js';
   import { quiz as mySongQuiz }     from './quizzes/my-song-quiz.js';
   // then in the catalogue array:
   { ...mySong, quiz: mySongQuiz, lyrics: mySongLyrics },
   ```
5. Save and push:
   ```bash
   git add .
   git commit -m "add my-song"
   git push
   ```

---

## Lyrics drawer (in-quiz)

During a quiz, a **📝 Lyrics** handle is fixed to the left edge of the screen. Clicking it
slides open a drawer showing the **full song lyrics**. The excerpt used in the current question
is **automatically highlighted** and scrolled into view. The drawer persists across questions
and closes automatically when leaving the quiz screen.

Lyrics are stored per song in `data/lyrics/[slug]-lyrics.js` as a plain template-literal string:

```js
export const lyrics = `Verse 1
Line one
Line two
...`;
```

Leave the string empty (`export const lyrics = \`\``) for coming-soon songs — the drawer will
display "No lyrics available yet" gracefully.

### Excerpt matching rules

The `highlightLyricsExcerpt()` function in `pages/quiz.html` tries to locate each question's
`lyrics` excerpt inside the full lyrics string. Two failure modes to avoid when writing quiz
excerpts:

1. **Character mismatch** — the excerpt must be an exact substring of the full lyrics string,
   including punctuation and quotation mark style. If the lyrics file uses `"` but the quiz
   uses `'`, the match silently fails.

2. **Non-adjacent lines** — the regex fallback tolerates up to 6 characters between lines
   (to absorb whitespace differences). If two lines in the excerpt are separated by other
   content in the full lyrics, the match fails. Always use lines that appear **consecutively**
   in the lyrics file.

---

## Spotify account linking

LyricWise lets users link their Spotify account to their profile using **OAuth 2.0 PKCE**
(no backend required).

### Setup

1. Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. In **Edit settings → Redirect URIs**, add:
   ```
   http://127.0.0.1:5500/lyricwise/pages/spotify-callback.html   ← local dev
   https://alexsky00.github.io/lyricwise/pages/spotify-callback.html  ← production
   ```
3. Copy the **Client ID** into `js/spotify-auth.js`:
   ```js
   export const SPOTIFY_CLIENT_ID = 'your_client_id_here';
   ```

### Flow

```
profile.html / login.html
  └─ startSpotifyAuth(returnTo)
       └─ Spotify consent screen
            └─ pages/spotify-callback.html   ← single registered redirect URI
                 ├─ handleSpotifyCallback()  ← PKCE token exchange + GET /v1/me
                 ├─ sessionStorage.setItem('sp_result', JSON.stringify(data))
                 └─ window.location.replace(returnTo)
                      └─ profile.html / login.html
                           └─ consumeSpotifyResult()
                                └─ updateProfile({ spotifyId, spotifyDisplayName, spotifyImage })
```

### Key exports from `js/spotify-auth.js`

| Export | Usage |
|---|---|
| `startSpotifyAuth(returnTo, stateKey?, stateData?)` | Redirect to Spotify consent screen |
| `handleSpotifyCallback()` | Called by `spotify-callback.html` only — exchanges code for token |
| `consumeSpotifyResult()` | Called on the return page — reads and clears `sp_result` from sessionStorage |

### Firestore fields added on link

| Field | Type | Description |
|---|---|---|
| `spotifyId` | string | Spotify user ID |
| `spotifyDisplayName` | string | Spotify display name |
| `spotifyImage` | string \| null | URL of the user's Spotify profile picture |

> **Playback vs linking** — linking a Spotify account stores the profile data in Firestore.
> It does not affect the embed player, which streams audio based on Spotify cookies in the
> browser independently.

---

## Editing an existing quiz

1. Open `pages/admin.html` in the browser
2. Switch to the **✏️ Edit Quiz** tab
3. Select the song and level — each question appears as an editable card
4. Modify lyrics, question, options, correct answer, timestamp, or feedback
5. Click **💾 Save file** (Chrome/Edge: writes directly to `data/quizzes/`) or
   **↓ Download .js** (all browsers: download then move to `data/quizzes/` manually)
6. Reload the app to see changes

---

## Authentication (Firebase)

LyricWise uses **Firebase Authentication** (Email/Password) and **Firestore** for user profiles.

### First-time setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add a Web app → copy the `firebaseConfig` into `js/firebase-config.js`
3. **Authentication** → Sign-in method → enable **Email/Password**
4. **Firestore Database** → Create database → start in **test mode**

### Auth flow

- All pages call `await requireAuth()` at load time — unauthenticated users are redirected
  to `pages/login.html`
- `pages/login.html` uses `checkAuth()` instead (no redirect — stays on the login page if
  not signed in)
- After sign-in/register, `auth.js` caches the profile in `localStorage` under
  `lw_profile_cache` so `renderNav()` can read it synchronously

### Profile data (Firestore)

Each user document is stored at `users/{uid}` with:

| Field | Type | Description |
|---|---|---|
| `uid` | string | Firebase Auth UID |
| `email` | string | Registration email |
| `username` | string | Unique identifier (`[a-zA-Z0-9_]+`) |
| `pseudo` | string | Display name shown in the UI |
| `smiley` | string | Emoji avatar (e.g. `"😎"`) |
| `createdAt` | number | Unix timestamp |

### Score namespacing

Quiz scores are stored in `localStorage` under `lw_<uid>_<songId>_<level>`.
`storage.js` exports `setCurrentUserId(uid)` — called by `auth.js` on every auth state
change. Each account sees only its own scores.

### Key exports from `js/auth.js`

| Export | Usage |
|---|---|
| `requireAuth()` | Protected pages — redirects to login if not signed in |
| `checkAuth()` | Login page only — resolves without redirecting |
| `register({email, password, username, pseudo, smiley})` | Create account |
| `login(email, password)` | Sign in |
| `logout()` | Sign out |
| `updateProfile(changes)` | Patch Firestore profile + local cache |
| `changePassword(currentPw, newPw)` | Re-authenticates then updates password |
| `getCurrentUser()` | Firebase Auth user object |
| `getCurrentProfile()` | Firestore profile object |
| `getCachedProfile()` | Sync read from `lw_profile_cache` |

---

## Light / Dark mode

The app ships with a dark theme by default. A ⚙ button at the right of the nav bar opens a
settings dropdown with a Light mode toggle. The choice is saved in `localStorage` as `lw_theme`
(`"dark"` or `"light"`) and reapplied on every page load before the first render.

**To change the default theme**, edit the fallback in `js/ui.js`:
```js
applyTheme(localStorage.getItem('lw_theme') || 'dark'); // ← change 'dark' to 'light'
```

**Theme tokens** are defined in `css/style.css` under `[data-theme="light"] { … }`.
The light palette uses blue-tinted card backgrounds (`#d8e0f5` / `#c8d4ee`) with dark text.
Both themes share the same blue accent variables (`--blue-main`, `--blue-light`, etc.).

---

## App version

The version string is defined in `js/ui.js`:

```js
export const APP_VERSION = '1.7-Alpha';
```

It is automatically displayed in:
- The **footer** of every page
- The **Admin page header** badge

To bump the version, change this one line.

---

## Deploy to GitHub Pages

Any push to `main` is automatically published to:
`https://alexsky00.github.io/lyricwise/`

```bash
git add .
git commit -m "describe your change"
git push
```
