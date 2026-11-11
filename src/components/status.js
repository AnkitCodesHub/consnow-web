/**
 * Same rules as the Android app (PeerStatusesViewModel / HomeScreen.FriendCard).
 *  - offline (no heartbeat 90 s) counts as locked
 *  - "active" = online AND (phone unlocked OR walking)
 */
export function liveStatus(data) {
  if (!data || (!data.activity && !data.steps)) return null;
  const isOnline = !!data.activity?.isOnline;
  const isLocked = !isOnline ? true : data.activity?.isLocked !== false;
  const isActive = !!data.steps?.isActive;
  const unlockedAt = data.activity?.unlockedAt ?? null;
  return {
    isOnline, isLocked, isActive, unlockedAt,
    lastUnlockedAtMs: unlockedAt ? Date.parse(unlockedAt) || 0 : 0,
    isUserActive: isOnline && (!isLocked || isActive),
  };
}

export function friendStatusLine(s) {
  if (!s) return 'Checking…';
  if (s.isUserActive && s.isActive && !s.isLocked) return 'Walking · phone in use';
  if (s.isUserActive && s.isActive) return 'Walking';
  if (s.isUserActive && !s.isLocked) return 'Phone in use';
  return 'Inactive';
}

/** Java String.hashCode(), so each friend gets the same avatar colour as in the app. */
export function javaHash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

export function initials(name = '') {
  return name.trim().split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
}
export const firstName = (full = '') => full.trim().split(/\s+/)[0] || '';

/** "2h 40m", "35m", "less than a minute" (ConnectionControls.formatRemaining) */
export function formatRemaining(ms) {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(minutes / 60), m = minutes % 60;
  if (minutes < 1) return 'less than a minute';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** "just now", "5m ago", "3h ago", "2d ago" (PeerStepsScreen.formatTimeAgo) */
export function timeAgoShort(ms, now = Date.now()) {
  if (!ms) return 'Unknown';
  const diff = now - ms;
  if (diff < 0) return 'just now';
  const minutes = Math.floor(diff / 60000), hours = Math.floor(minutes / 60);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
