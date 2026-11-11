/** Turns the server's activity object into one phone-status label. */
export function phoneStatus(activity) {
  if (!activity || (activity.isLocked == null && !activity.unlockedAt)) return { key: 'unknown', label: 'No data yet' };
  if (activity.isLocked === false && activity.isOnline) return { key: 'unlocked', label: 'Using phone' };
  if (activity.isLocked === false) return { key: 'offline', label: 'Phone offline' };
  return { key: 'locked', label: 'Phone locked' };
}
