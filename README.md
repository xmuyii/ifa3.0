# Ifatarot — Vercel Deployment

## Quick deploy

1. Push this repo to GitHub
2. Go to vercel.com → New Project → import your repo
3. Vercel auto-detects Vite — no build settings needed
4. Add environment variables (Settings → Environment Variables):

```
AI_PROVIDER=gemini          # or anthropic, deepseek
GEMINI_API_KEY=...          # from aistudio.google.com
ANTHROPIC_API_KEY=...       # from console.anthropic.com (if using anthropic)
DEEPSEEK_API_KEY=...        # from platform.deepseek.com (if using deepseek)
ADMIN_PASSPHRASE=...        # your secret — type at bottom of Settings in app
```

5. Deploy. Done.

## Adding your Tarot card images

Create a `public/tarot/` folder and drop in your card images with these exact filenames:

**Major Arcana** (Major00.jpg → Major21.jpg):
Major00=The Fool, Major01=The Magician, Major02=The High Priestess,
Major03=The Empress, Major04=The Emperor, Major05=The Hierophant,
Major06=The Lovers, Major07=The Chariot, Major08=Strength,
Major09=The Hermit, Major10=Wheel of Fortune, Major11=Justice,
Major12=The Hanged Man, Major13=Death, Major14=Temperance,
Major15=The Devil, Major16=The Tower, Major17=The Star,
Major18=The Moon, Major19=The Sun, Major20=Judgement, Major21=The World

**Minor Arcana suits** (01=Ace through 14=King):
Cups01–Cups14, Wands01–Wands14, Swords01–Swords14, Coins01–Coins14

Note: The app uses "Pentacles" internally but maps to your "Coins" filenames automatically.
If an image file is missing, the card falls back to the SVG placeholder.

## AI provider switching

Change `AI_PROVIDER` in Vercel's environment variables — no redeploy of frontend needed.
Supported values: `anthropic`, `deepseek`, `gemini`

## Admin panel

In the app, scroll to the bottom of Settings. Type your `ADMIN_PASSPHRASE` in the small
unlabeled field and press Enter. Note: server-side usage stats are not persistent on
Vercel serverless (they reset per cold start). For persistent stats, add Vercel KV later.

## Notes on credits

Credits are enforced client-side on Vercel (8 consultations, +1 every 3 hours rolling).
The server no longer tracks credits — this trades server-side enforcement for simplicity
and free hosting.
