# Consnow Web

Web dashboard for Consnow (React + JavaScript, Vite). Log in with the same email/password as the Android app and see every connected friend's:

- steps today
- last active / "Walking now"
- phone status: using phone, locked, or offline (no heartbeat for 90 s)
- last unlock time

It talks to the existing NestJS backend (`consnow-backend-production.up.railway.app`). No backend changes are needed.

## Design
The UI copies the Android app (`consnow-android`), not a separate web design:
- Same Material 3 theme (Teal `#00897B`, Slate background) and the app's Friends palette, light + dark, Roboto font
- Same screens: Sign in, Home (Today's Steps arc card, Synced pill, "Last moved…" / walking figure, animated padlock, Your code), Friends list (Active now / Inactive / Not connected), friend screen, Connect, Requests
- Same animations: step-arc progress, walking figure (ported from `WalkingIndicator.kt`), lock/unlock padlock (`LockStatusWidget.kt`), press-and-hold on the step card to see who viewed you
- Same round connect/disconnect buttons, snackbar with Undo, delete-account dialog

On a laptop (≥1180 px) it shows three columns: you · friends · the selected friend. On smaller screens it is the app layout, one column, and a friend opens as its own screen with ← Back.

## Features
- Log in / create account with the same account as the app
- Live updates over the same Socket.IO gateway (`peer_unlocked`, `peer_locked`, `peer_activity`, `connection_changed`), plus a 20 s refresh like the app
- Add a friend by code, accept / decline / cancel requests, disconnect with 5 s Undo
- Consent rules as in the app: no data drawn for friends who aren't connected

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
```

## Configure
Copy `.env.example` to `.env` and change `VITE_API_URL` only if the backend URL changes.

## Deploy (pick one)
**Vercel:** `npm i -g vercel && vercel` → framework "Vite", build `npm run build`, output `dist`.
**Netlify:** drag the `dist/` folder (after `npm run build`) onto app.netlify.com/drop.
**Railway:** new service from this repo → build `npm run build`, start `npx vite preview --host 0.0.0.0 --port $PORT`.

The backend already allows all origins (`enableCors({ origin: '*' })`). If you lock CORS down later, add the web domain to the allowed list.

## Structure
```
src/
  api/client.js        fetch wrapper, JWT storage, 401 → sign out
  api/consnow.js       every backend endpoint used
  hooks/useAuth.jsx    login/register/logout context
  hooks/useConsnow.js  friends, live data, socket, polling
  components/          AuthPage, Dashboard, PeerCard, PeerModal, InactiveRow, AddFriend
```
