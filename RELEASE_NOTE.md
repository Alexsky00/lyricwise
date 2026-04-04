# LyricWise — Release Notes

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
