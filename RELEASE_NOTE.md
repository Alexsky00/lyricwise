# LyricWise — Release Notes

---

## v1.7-Alpha
*April 2026*

---

### New features

**Spotify account linking**
Users can now link their Spotify account to their LyricWise profile.

- **Profile page** (`pages/profile.html`) — new "Spotify account" section:
  - If not linked: green "Link Spotify account" button
  - If linked: card showing the Spotify avatar and display name, with an "Unlink" button
- **Registration form** (`pages/login.html`) — optional "Link Spotify account" step in the
  Create account form; Spotify data is stored alongside the profile on registration
- After linking, the Spotify display name and avatar are saved to Firestore (`spotifyId`,
  `spotifyDisplayName`, `spotifyImage` fields on the user document)

The flow uses **OAuth 2.0 Authorization Code + PKCE** (no backend required):
1. User clicks "Link Spotify" → redirected to Spotify's consent screen
2. Spotify redirects to `pages/spotify-callback.html` (the single registered redirect URI)
3. The callback page exchanges the code for a token, fetches `/v1/me`, stores the result in
   `sessionStorage`, then redirects back to the originating page
4. The originating page calls `consumeSpotifyResult()` and saves to Firestore

> **Note on playback** — linking a Spotify account to a LyricWise profile is separate from
> the embed player. The embed player streams audio based on Spotify cookies in the browser,
> not on the linked account. Full playback requires being signed in to Spotify in the browser.

**Green smoke effect — Could You Be Loved**
A greenish smoke particle animation plays at the start of every quiz for *Could You Be Loved*
(Bob Marley), regardless of level. Implemented via the shared `confetti-canvas` element.
The effect fades out automatically after 5 seconds.

---

### Technical changes

- `js/spotify-auth.js` — new module: `startSpotifyAuth()`, `handleSpotifyCallback()`,
  `consumeSpotifyResult()`, PKCE helpers, `_callbackUri()` (always points to the dedicated
  callback page)
- `pages/spotify-callback.html` — new dedicated OAuth callback page; on error it renders
  the exact redirect URI to register in the Spotify dashboard
- `pages/profile.html` — Spotify section, `renderSpotifySection()`, link/unlink handlers,
  `consumeSpotifyResult()` called on load
- `pages/login.html` — optional Spotify step in the register form; form state saved to
  `sessionStorage` before redirect and restored on return
- `js/auth.js` — `register()` now accepts `spotifyId`, `spotifyDisplayName`, `spotifyImage`
- `js/ui.js` — `launchGreenSmoke()` exported; version bumped to `1.7-Alpha`
- `css/style.css` — `.btn-spotify`, `.btn-spotify-unlink`, `.spotify-linked-card`,
  `.spotify-linked-avatar`, `.spotify-linked-avatar-placeholder`, `.spotify-linked-info`

---

---

## v1.6-Alpha
*April 2026*

---

### New content

**Could You Be Loved — Bob Marley**
Seventh song added to the catalogue. Available at levels **A1**, **A2**, and **B1**.
The quiz covers vocabulary (fool, school, rearrange), figurative language (darkness/light
metaphor), cultural references (survival of the fittest), and structural analysis (use of
repetition).

---

### Bug fixes

**Quiz excerpt matching in the lyrics drawer**
The `highlightLyricsExcerpt()` function in `pages/quiz.html` searches the full lyrics string
for the current question's excerpt and highlights it in blue. Two categories of mismatch were
causing silent failures (no highlight, no error):

- **Quotation mark mismatch** — quiz excerpts used straight single quotes (`'`) while the
  corresponding lines in the lyrics file used double quotes (`"`). The search (both exact and
  regex) was returning no match.
- **Non-adjacent lines** — some excerpts combined lines separated by other content in the
  full lyrics. The regex tolerates at most 6 characters between consecutive excerpt lines,
  so these gaps caused the match to fail silently.

Both issues were fixed in `data/quizzes/could-you-be-loved-quiz.js`:
- A2/Q4 and B1/Q4 — corrected quotation marks in the `They say, "Only, only…"` excerpt
- A1/Q5 — simplified to `Stay alive, eh` (single consecutive line)
- B1/Q5 — replaced with three consecutive lines (`Could you be loved…` / `Could you be
  loved, wo now…` / `Love your brotherman`) instead of a non-contiguous four-line selection

---

### Technical changes

- `data/songs/could-you-be-loved.js` — new song metadata
- `data/lyrics/could-you-be-loved-lyrics.js` — full lyrics
- `data/quizzes/could-you-be-loved-quiz.js` — A1 / A2 / B1 questions (5 each)
- `data/index.js` — song imported and added to catalogue
- `js/ui.js` — version bumped to `1.6-Alpha`

---

---

## v1.5-Alpha
*April 2026*

---

### New features

**In-quiz lyrics drawer**
A persistent **📝 Lyrics** tab is fixed to the left edge of the screen during a quiz.
Clicking it slides open a drawer showing the full lyrics of the song being quizzed.
The excerpt of the current question is automatically **highlighted in blue** and scrolled
into view inside the drawer. The highlight updates on every question change.

The drawer:
- Opens/closes via the left-edge handle (click again or press ✕ to close)
- Slides with the handle — the handle moves right when the drawer is open so it remains
  reachable at all times
- Closes automatically when leaving the quiz screen (score, level select)
- Shows "No lyrics available yet" gracefully when a song has no lyrics file

**Full lyrics data layer** (`data/lyrics/`)
A new `data/lyrics/` folder stores the full text of each song as a JS module:
```
data/lyrics/[slug]-lyrics.js  →  export const lyrics = `…`;
```
Lyrics are imported in `data/index.js` and attached to each catalogue entry as a `lyrics`
property alongside `quiz`. Six songs are now populated; Starships is a placeholder.

**Lyrics export in admin Add Song flow**
The **↓ Download lyrics/[slug]-lyrics.js** button is now generated alongside the song and
quiz exports. The textarea content from step 3 (lyrics) is packaged into the file automatically.
The generated `index.js` snippet includes all three import lines (song, lyrics, quiz).

---

### Technical changes

- `data/lyrics/` — new folder, one `[slug]-lyrics.js` per song
- `data/index.js` — imports and attaches `lyrics` to every catalogue entry
- `pages/quiz.html` — lyrics drawer HTML, tab handle, `buildLyricsDrawer()`,
  `highlightLyricsExcerpt()` with exact + regex-tolerant whitespace matching,
  `showScreen()` updated to show/hide handle and auto-close drawer
- `pages/admin.html` — `exportLyricsFile()`, third download button, updated `buildIndexSnippet()`
- `css/style.css` — drawer, handle, highlight, empty-state styles

---

---

## v1.4-Alpha
*April 2026*

---

### New features

**User accounts — Firebase Authentication**
LyricWise now has a full account system powered by Firebase Auth (Email/Password) and
Firestore for profile storage. Every page requires sign-in; unauthenticated users are
redirected to the login page.

**Sign-in / Registration page** (`pages/login.html`)
A dedicated auth page with two tabs:
- **Sign in** — email + password
- **Create account** — email, username, password, pseudo, and a smiley avatar picker

Registration validates username format (`[a-zA-Z0-9_]+`) and pseudo length client-side
before hitting Firebase. Firebase errors are mapped to human-readable messages.

**Smiley avatar picker**
Users choose a profile emoji from a grid of 32 options (faces, animals, objects).
The same picker is reused on the registration and profile pages. Selected state is
highlighted with a blue border and glow.

**Profile page** (`pages/profile.html`)
Accessible from the settings popover. Lets signed-in users change:
- **Pseudo** (display name) — min. 2 characters
- **Smiley avatar** — same picker as registration
- **Password** — requires current password for re-authentication before updating

**User info in the nav bar**
When signed in, the ⚙ button is replaced by a pill showing the user's smiley + pseudo.
Clicking it opens the settings popover, which now shows the user's avatar, pseudo and
email at the top, followed by theme toggle, "Edit Profile" link, and "Sign out".

**Per-user score isolation**
Quiz scores in `localStorage` are now namespaced by Firebase UID
(`lw_<uid>_<songId>_<level>`). Multiple accounts on the same browser each see only
their own stats. `storage.js` exposes `setCurrentUserId(uid)`, called automatically
by `auth.js` on sign-in/out.

---

### Technical changes

- `js/firebase-config.js` — Firebase project config (fill in before deploy)
- `js/auth.js` — central auth module: `register`, `login`, `logout`, `updateProfile`,
  `changePassword`, `requireAuth` (guard), `checkAuth` (login page only)
- `js/router.js` — `login` and `profile` added to the page list
- `js/ui.js` — `renderNav(activePage, profile)` now accepts an optional profile object;
  `lw.signOut()` added to the global shortcut object
- All existing pages — import and `await requireAuth()` added; profile passed to `renderNav`

---

---

## v1.3-Alpha
*April 2026*

---

### New features

**Admin password protection**
The admin page is now gated behind a password prompt. The content is hidden until the
correct password is entered. Verification uses SHA-256 hashing via the Web Crypto API —
the password is never compared in plain text. A rotating set of funny messages is shown on
wrong attempts. Authentication persists for the browser session (`sessionStorage`).
Password is configurable via `const ADMIN_PW` in `pages/admin.html`.

**YouTube float window — draggable**
The floating YouTube video window can now be freely moved across the screen by
clicking and dragging the title bar (mouse and touch). It stays within screen bounds
and switches from CSS anchoring to absolute positioning on first drag.

---

### Improvements

**Light mode — new blue palette**
The light mode palette was reworked from a blue-tinted grey to a warmer sky-blue scheme:
`--bg-deep: #e8f4fc`, `--bg-card: #b8dbf0`, `--bg-panel: #7aafc7`. Accent and text
colors adjusted accordingly. Song card art gradient updated to a very subtle blue-white.

**Light mode — level badges**
Level badges (library, level-select, quiz bar, stats) now render as solid pastel fills
with white text in light mode, matching the mockup:
A1 `#52b788` · A2 `#74c69d` · B1 `#74a8e0` · B2 `#a07cd6` · C1 `#e07878`.
Applied uniformly across `.level-badge`, `.level-circle`, `.quiz-level-pill`, `.stats-level-pill`.

---

---

## v1.2-Alpha
*April 2026*

---

### New features

**Version number display**
The app version is defined as a single string constant (`APP_VERSION` in `js/ui.js`).
It appears in the footer of every page and in the badge on the Admin page header.
Changing the version in one place updates the entire app.

**Settings menu (⚙)**
A gear button at the right end of the navigation bar opens a dropdown with app settings.
Currently contains the Light / Dark mode toggle. Closes on outside click.

**Light / Dark mode toggle**
Available in the ⚙ settings dropdown on every page. Switches between Dark (default) and
Light themes. Preference is saved in `localStorage` (`lw_theme`) and applied before the
first render to avoid any flash. Light mode uses a blue-tinted palette; dark mode is unchanged.

---

---

## v1.0-Alpha — Multi-file project
*April 3rd 2026*

First release of the modular, multi-page architecture. This version supersedes the standalone
v1.13 HTML prototype and introduces a maintainable codebase, new songs, and several bug fixes.

---

### Architecture — full rewrite

The entire application has been migrated from a single self-contained HTML file to a
structured multi-page project with ES modules.

| | Standalone v1.13 | v1.0-Alpha |
|---|---|---|
| Structure | Single `.html` file (~2 000 lines) | Multi-page app with separate files |
| Styles | Inline `<style>` block | `css/style.css` |
| Logic | Inline `<script>` block | `js/` modules (`player.js`, `quiz.js`, `ui.js`, `storage.js`, `router.js`) |
| Data | Hardcoded in JS objects | `data/songs/*.js` + `data/quizzes/*.js` |
| Navigation | `showScreen()` — DOM visibility toggle | `router.js` — real URL changes between pages |
| Pages | 6 screens in one file | `index.html`, `pages/home.html`, `pages/library.html`, `pages/quiz.html`, `pages/stats.html`, `pages/admin.html` |

---

### New songs

Two fully playable songs added; one coming-soon placeholder.

| Song              | Artist         | Status        | Levels                 |
|---                |---             |---            |---                     |
| Stand By Me       | Ben E. King    | Available     | A1 · A2 · B1 · B2 · C1 |
| Careless Whisper  | George Michael | Available     | A1 · A2 · B1 · B2 · C1 |
| Words             | F.R. David     | Available     | A1 · A2 · B1           |
| Starships         | Nicki Minaj    | Coming Soon   | —                      |

Songs already present in v1.13 (Carry On Wayward Son, On & On, Heroes Tonight) are unchanged.

---

### New features

**Admin page — Add Song tab** (`pages/admin.html`)
A new admin-only tool that generates AI quiz prompts. The page produces a structured prompt
to copy into Claude, which returns a ready-to-paste quiz file for any song and level.
Download buttons are available to export the generated `songs/*.js` and `quizzes/*.js` files.
> ⚠️ Requires access to the source code to be useful.

**Admin page — Edit Quiz tab** (`pages/admin.html`)
A second sub-tab allows editing existing quiz questions directly in the browser:
- Dropdown to select any available song; level buttons dim automatically for missing levels
- Each question is rendered as an editable card: lyrics excerpt, question text, 4 options,
  correct answer (radio), timestamp, and feedback
- **Save file** button: uses the File System Access API to write the updated `.js` file
  directly to `data/quizzes/` on disk (Chrome/Edge only)
- **Download .js** button: universal fallback — downloads the file to move manually
- All levels are preserved in the output; only the edited level is changed

**Coming-soon level badge graying**
Level badges on coming-soon cards are now visually disabled: `opacity: 0.28`,
`text-decoration: line-through`, `pointer-events: none`. Previously they appeared identical
to active badges.

---

### Bug fixes

**Spotify seek on first play**
In v1.13, clicking "Go to [timestamp]" before the Spotify player had ever been started would
launch playback at 0:00 instead of the requested timestamp. Fixed by introducing a
`pendingSeek` state variable: the desired position is stored on click, `resume()` is called,
and the actual `seek()` fires on the first `playback_update` event once playback is confirmed
active. A 1-second fallback timeout is included in case the event never fires.

**Confetti not visible on perfect score**
The confetti `<canvas>` had `display: none` set in the CSS. `launchConfetti()` now explicitly
sets `display: block` before drawing and restores `display: none` after the animation ends.

**Quiz feedback icon inverted**
All quiz feedback strings in the data files start with `❌`. The display logic was inverted:
correct answers now replace `❌` with `✅` (green), wrong answers keep `❌` (red) as-is.

---

### UI changes

| Element | v1.13 | v1.0-Alpha |
|---|---|---|
| Correct answer feedback icon | ✅ | ✅ (restored) |
| Wrong answer feedback icon | ✅ | ❌ |
| Navigation — library link | "Library" + "Browse Songs" (duplicate) | "Browse Songs" only |
| Coming-soon level badges | Full opacity, no pointer style | Grayed out, line-through |

---

### Known issues

- **Heroes Tonight — seek timestamps**: all questions currently have `timestamp: 0`.
  Correct timestamps need to be added manually to `data/quizzes/heroes-tonight-quiz.js`
  for all 5 levels (25 questions).
- **Seek timestamp accuracy**: timestamps across all songs are approximate estimates and
  may not land exactly on the correct excerpt. Each song requires manual calibration.

---

---

## Standalone v1.13
*March 2026 — reference version, superseded*

Last release of the single-file prototype. Changelog reproduced for historical reference.

### New feature — Excerpt seek helper
Each quiz excerpt shows a `?` icon in the bottom-right corner. Clicking it opens a popover
showing the timestamp for that passage. If Spotify is active, a "Go to [mm:ss]" button seeks
directly to that moment via `EmbedController.seek()`. If YouTube is active, a notice indicates
the feature is Spotify-only.

### New feature — Spotify iFrame API integration
The Spotify player is now loaded via the official iFrame API instead of a static `<iframe>`.
This enables programmatic control: `seek()`, `resume()`, and the `playback_update` event.

### Improvement — Play / pause indicator in the player bar
The "Now Playing" indicator is now dynamic. It is hidden before any playback. When music
plays, an animated pulsing dot appears alongside the label "Now Playing". When paused, two
static bars appear and the label changes to "Paused". State is driven by the `playback_update`
event.

### Improvement — Player bar tab order — Spotify first
The Spotify tab is now shown to the left of the YouTube tab and selected by default when
opening the player.

### Improvement — YouTube tab — animated music card instead of thumbnail
The YouTube tab no longer shows a static thumbnail (often blocked by the video owner).
It now shows an animated equaliser card with 7 bars. A "Float Window" button opens the video
in a draggable overlay; a direct YouTube link is also provided.

### Improvement — YouTube embed error detection
The float window uses the YouTube iFrame API to detect error codes 101/150 (embedding
disabled by owner). When embedding is blocked, a friendly message is shown with a direct
watch link instead of a blank player.

### Improvement — Song shown in quiz top bar
The quiz top bar now displays the song title and artist. The label is updated by
`initMusicPlayer()` at quiz start.

### Know issues — Timestamps need some adjustments
Timestamps used for the seek feature are approximate estimates and may not match the correct
excerpt precisely. The three available songs require manual adjustment.

### Error — Heroes Tonight — Timestamps
Heroes Tonight (Janji ft. Johnning) has no timestamp values in its quiz data.
All questions default to `0:00`. Correct timestamps must be added to `quizDataHeroesTonight`
for all 5 levels (25 questions).
