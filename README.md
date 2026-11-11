# Consnow Web

Web dashboard for Consnow (React + JavaScript, Vite). Log in with the same email/password as the Android app and see every connected friend's:

- steps today
- last active / "Walking now"
- phone status: using phone, locked, or offline (no heartbeat for 90 s)
- last unlock time

It talks to the existing NestJS backend (`consnow-backend-production.up.railway.app`). No backend changes are needed.

## Features
- Log in / create account (`/auth/login`, `/auth/register`, token refresh on load)
- Friends grid with search + sort (recently active, most steps, name)
- Live updates over the same Socket.IO gateway as the app: `peer_unlocked`, `peer_locked`, `peer_activity`, `connection_changed`
- Steps refresh every 30 s (the server doesn't push step counts), lock state every 60 s as a safety net, and a full refresh when the tab comes back into view or the date changes at midnight
- Your connection code (click to copy) + connect by a friend's code
- Not connected list: Connect, Cancel request, Accept / Decline, cooldown timer
- Disconnect with a 5 s Undo
- Opening a friend's card records a profile view (same as the app), and "Checked on you today" lists who viewed you
- Consent: data is shown only for `connected` friends and is wiped from memory when a friend disconnects
- Light/dark mode follows the system; responsive down to phone width

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
