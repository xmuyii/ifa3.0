# Ifatarot — deploy guide (Railway)

Same app as the Claude preview, restructured with a real backend so your
Anthropic API key stays private, a rolling credit system that enforces
itself server-side, and a PWA manifest so it installs like an app with no
app store.

## 1. Get an API key

https://console.anthropic.com -> API Keys. Add a payment method — this is
pay-per-use (see the cost estimates earlier in this conversation).

## 2. Push this to GitHub

```
git init
git add .
git commit -m "Ifatarot"
```

Create a repo on GitHub and push.

## 3. Deploy on Railway

1. https://railway.app -> New Project -> Deploy from GitHub repo -> pick this repo.
2. Railway auto-detects Node and will run `npm install`, then `npm run build`
   (builds the frontend into `dist/`), then `npm start` (runs `server.js`,
   which serves `dist/` and handles `/api/generate`).
3. Add a variable: Settings -> Variables -> `ANTHROPIC_API_KEY` = your real key.
4. Railway gives you a live URL immediately — no separate frontend/backend
   deploys, it's one service.
5. Optional: add a custom domain under Settings -> Networking.

If Railway doesn't auto-detect the build/start commands, set them explicitly
in Settings -> Deploy: build command `npm run build`, start command `npm start`.

## 4. Install it — PC, Android, iOS, no app store

This is one web app. "Installing" it anywhere just means opening the URL and
adding it to the screen:

- **Windows/Mac (Chrome or Edge):** address bar -> install icon (or menu ->
  "Install Ifatarot…"). Gives it a real window and a taskbar/dock icon —
  this is your "PC version," no separate build needed.
- **Android (Chrome):** menu (⋮) -> "Add to Home screen" / "Install app."
- **iPhone/iPad (must be Safari, not Chrome):** Share button -> "Add to Home
  Screen." iOS only allows PWA installs through Safari.

All three open full-screen with a real icon, no browser bar, no Play Store
or App Store review. One codebase, one deploy, every device.

One iOS-specific quirk worth knowing: Safari can clear site storage after 7
days of not opening the *browser tab* version of a site — but that clock
doesn't apply once it's added to the home screen, which is exactly what
you're doing, so saved profiles/notes are safe.

## Switching AI providers

The server talks to whichever provider `AI_PROVIDER` names, normalizing its
response so the frontend never knows which one answered. To switch:

1. In Railway, Settings -> Variables, add the new provider's key
   (`DEEPSEEK_API_KEY` for DeepSeek) and set `AI_PROVIDER=deepseek`.
2. Save. Railway restarts the service. That's it — no code change, no
   rebuild of the frontend.

Currently supported: `anthropic` (default), `deepseek`, and `gemini`. Each is a small,
self-contained block in `server.js` under `PROVIDERS` — adding a third
provider later means adding one more block there, in the same shape.

Worth knowing before you switch: different providers vary in reply quality,
consistency of following the strategist's persona instructions, and latency
— "does it work" and "does it sound like the same strategist" are two
different questions, worth testing before committing.

## What's server-enforced now, not just cosmetic

`server.js` tracks a rolling credit count per device (8 max, refills 1 every
3 hours — never a hard "come back tomorrow" reset) and rejects requests with
a friendly wait-time message once someone's out. This lives in memory, so it
resets if the Railway service restarts — fine for testing, but move it to
Postgres or Redis before this matters for real (i.e. before someone could
restart your service to reset their own limit).

"Internal" calls — the quiet classification that guesses which reading depth
fits a question, and the background check for Vessel insights — are flagged
and don't cost the seeker a consultation. Only their own questions and
readings do.

## The hidden admin panel

Set `ADMIN_PASSPHRASE` in Railway's environment variables to whatever you
like. In the app, scroll to the very bottom of Settings — there's a small,
unlabeled, low-contrast text field styled to look like a version number
("Ifatarot v1.0.0"). Type your passphrase there and press Enter. Get it
right and you're dropped into an aggregate stats screen: total devices/
sessions, active in the last 24h/7d, total consultations used, readings vs.
strategist chats, Ifa/Tarot split, most-drawn Tarot card and odu across
everyone, and a 7-day chart. Get it wrong (or leave it unset) and nothing
visibly happens — no error, no shake, it just clears. That silence is
intentional; a "wrong password" message would tell a curious visitor the
field does something.

This data is collected server-side now (see `serverEvents` in `server.js`),
which is a real change from before — previously nothing left a visitor's own
device. It's anonymous (a random device ID, no names or questions asked, no
reading content), but it is new data collection, worth being straightforward
about if this is ever a multi-user product rather than just you testing it.

Same in-memory caveat as the credit system: this resets on a service
restart. Move to real storage before it needs to survive that.

Unlocking the panel also flags that specific device as an admin device,
server-side. From then on, that device's own readings and strategist
messages skip the credit limit entirely — a fast lane for you while
everyone else's rolling credits still apply. Its own draws don't count
toward the usage stats you're looking at, so the numbers stay
representative of real seekers, not your own testing. This flag lives in
the same in-memory store as everything else here, so a service restart
clears it too — re-enter the passphrase once after a redeploy to reopen
the fast lane.

## Everything else that still applies

- **Storage is per-device** (localStorage) — profiles, notes, Vessel
  insights, and stats don't sync across a seeker's own devices yet. That
  needs real accounts + a database, a bigger step for later.
- **Card art is still placeholder.** Host real files anywhere public and
  swap them into `TarotArt`/`OduArt` in `src/App.jsx`.
- **No payment flow yet** — credits are a usage cap, not a paywall. Adding
  "buy more" is a Stripe integration away when you're ready.
