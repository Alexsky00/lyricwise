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
├── index.html          ← entry point (redirects to home)
├── css/
│   └── style.css       ← all styles
├── pages/
│   ├── home.html
│   ├── library.html
│   ├── quiz.html
│   ├── stats.html
│   └── admin.html
├── js/
│   ├── router.js       ← navigation between pages
│   ├── quiz.js         ← quiz state and logic
│   ├── player.js       ← Spotify + YouTube embeds
│   ├── storage.js      ← localStorage (scores)
│   ├── ui.js           ← nav, confetti, toast
│   └── seek.js         ← excerpt seek helper
└── data/
    ├── index.js        ← assembles all songs — edit this to add a song
    ├── songs/          ← one file per song (metadata only)
    └── quizzes/        ← one file per song (questions only)
```

---

## Adding a new song

### Option A — Admin page (recommended)

1. Open `pages/admin.html` in the browser
2. Fill in the song info (title, artist, YouTube/Spotify IDs, icon)
3. Paste the lyrics and click **✨ Generate quiz with AI →** — copy the prompt into Claude
4. Paste Claude's JSON response back into the modal and click **Import**
5. Download the two generated files (`songs/[slug].js` and `quizzes/[slug]-quiz.js`)
6. Move them into `data/songs/` and `data/quizzes/`
7. Open `data/index.js` and add the import lines shown by the admin page
8. Push to GitHub

### Option B — Manual

1. Create `data/songs/my-song.js` (copy an existing one as template)
2. Create `data/quizzes/my-song-quiz.js` (copy an existing one as template)
3. Open `data/index.js` and add:
   ```js
   import { song as mySong }     from './songs/my-song.js';
   import { quiz as mySongQuiz } from './quizzes/my-song-quiz.js';
   // then in the catalogue array:
   { ...mySong, quiz: mySongQuiz },
   ```
4. Save and push:
   ```bash
   git add .
   git commit -m "add my-song"
   git push
   ```

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
export const APP_VERSION = '1.2-Alpha';
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
