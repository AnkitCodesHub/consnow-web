// Backend base URL. Override with VITE_API_URL in a .env file.
export const API_URL = (
  import.meta.env.VITE_API_URL || 'https://consnow-backend-production.up.railway.app'
).replace(/\/+$/, '');

// Steps have no live socket event, so we refresh them on a timer.
export const STEPS_POLL_MS = 20_000; // same as the Android app (PeerStatusesViewModel.POLL_MS)
// Lock/online state also gets a slow safety-net refresh (socket covers the rest).
export const ACTIVITY_POLL_MS = 20_000;
// How long the "Undo" bar stays after Disconnect (server allows 15 s).
export const UNDO_MS = 5_000;
export const APP_VERSION = '1.0.0';
export const PRIVACY_URL = 'https://ankitcodeshub.github.io/consow-privacy/';
