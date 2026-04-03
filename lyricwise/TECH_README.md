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

1. Create `data/songs/my-song.js` (copy an existing one as template)
2. Create `data/quizzes/my-song.js` (copy an existing one as template)
3. Open `data/index.js` and add:
   ```js
   import { song as mySong }     from './songs/my-song.js';
   import { quiz as mySongQuiz } from './quizzes/my-song.js';
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

## Deploy to GitHub Pages

Any push to `main` is automatically published to:
`https://alexsky00.github.io/lyricwise/`

```bash
git add .
git commit -m "describe your change"
git push
```
