import { useEffect, useState } from 'react';

/** Re-renders every `ms` so "5 min ago" labels stay fresh. */
export function useNow(ms = 20_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
