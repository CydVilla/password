# Password

Password is a daily web game with an 80s terminal/Zork-inspired interface. Players enter a handle, ask up to five hint questions, and try to guess the daily password drawn from a news-trend style topic pool. Correct players are added to a same-day leaderboard that resets with the daily puzzle.

This first version is fully offline and deployable as a static GitHub Pages app.

## Features

- React + TypeScript + Vite app
- Daily password selected deterministically from an offline trend list
- Puzzle day resets at 6:00 AM local time
- Five-question hint daemon with answer-redaction guardrails
- Wrong-guess feedback with cold/warm/hot taunts
- Local daily leaderboard stored in `localStorage`
- GitHub Pages workflow in `.github/workflows/deploy.yml`

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production build is written to `dist/`.

## GitHub Pages

After this branch is merged, enable GitHub Pages in the repository settings with **GitHub Actions** as the source. The included workflow builds and deploys the app whenever `main` is pushed.

## AI and live trends roadmap

The current implementation intentionally does not call OpenAI from the browser. A GitHub Pages app is static, so putting an OpenAI API key in frontend code would expose it to everyone.

Recommended next step for real AI-powered trends:

1. Add a small backend or serverless function that stores the OpenAI API key securely.
2. Have that backend ask an OpenAI model for a daily password candidate and safe metadata such as category, trend summary, and hint-safe proximity terms.
3. Cache the selected puzzle for the current 6:00 AM game day so every player sees the same answer.
4. Move the leaderboard to a shared data store if rankings should be global across all players.

Until then, `src/game/dailyPassword.ts` contains the offline provider that can be replaced by a hosted provider later.