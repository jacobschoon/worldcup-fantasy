# World Cup Fantasy 2026

A fantasy football app for the 2026 FIFA World Cup. Built with Vite + React.

## Features
- Squad builder with flexible formations (3-4-3 through 5-4-1, min. 3 defenders)
- Position rules: GK/DEF locked to their slots, wingers float MID or FWD, attacking mids MID only, strikers FWD only
- Configurable scoring rules (goals by slot, playing time tiers, clean sheets, cards)
- Live leaderboard with podium, per-player breakdown
- Live data via API-Football (free tier, 100 req/day)

## Deploy to Vercel (free)

### 1. Push to GitHub
```bash
cd worldcup-fantasy
git init
git add .
git commit -m "Initial commit"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/worldcup-fantasy.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project**
3. Import your `worldcup-fantasy` repo
4. Leave all settings as default — Vercel detects Vite automatically
5. Click **Deploy**

Your app will be live at `https://worldcup-fantasy.vercel.app` (or similar).

### 3. Add your API key
1. Open the deployed app
2. Go to **Settings** tab
3. Paste your RapidAPI key (API-Football free plan)
4. Click **Test** to verify, then **Save**

The key is stored in your browser only. Your friends visit the same link but don't need a key — the leaderboard shows shared team data.

## Local development
```bash
npm install
npm run dev
```

## API
- Provider: [API-Football via RapidAPI](https://rapidapi.com/api-sports/api/api-football)
- World Cup 2026: `league=1`, `season=2026`
- Free tier: 100 requests/day (more than enough)
- Stats cached in localStorage — each finished game costs 1 request, ever
