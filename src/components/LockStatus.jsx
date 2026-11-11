import { useEffect, useRef, useState } from 'react';
import { useSecondTick } from './Walking';

/**
 * ui/components/LockStatusWidget.kt — animated padlock + "Unlocked" / "Last Unlocked 5m ago".
 * Unlock: key turns → shackle pops up → shackle turns around its right leg.
 * Lock: shackle turns back → drops in → body "thunks".
 */
function LockIcon({ isLocked, size = 56 }) {
  const [ready, setReady] = useState(false);   // no animation on first appearance
  const [pulse, setPulse] = useState(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; const id = requestAnimationFrame(() => setReady(true)); return () => cancelAnimationFrame(id); }
    setPulse((p) => p + 1);
  }, [isLocked]);

  return (
    <svg className={`lock-icon ${isLocked ? 'locked' : 'unlocked'} ${ready ? 'ready' : ''}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle className="halo" cx="50" cy="60" r="50" />
      {pulse > 0 && <circle key={pulse} className="ring" cx="50" cy="60" r="40" />}
      <g className="shackle-lift">
        <g className="shackle-spin">
          <path d="M31 56 L31 34 A19 19 0 0 1 69 34 L69 56" fill="none" strokeWidth="8.5" strokeLinecap="round" className="shackle" />
        </g>
      </g>
      <rect key={`b${pulse}`} className={`body ${isLocked && pulse ? 'thunk' : ''}`} x="18" y="50" width="64" height="44" rx="13" />
      <g className="keyhole">
        <circle cx="50" cy="68" r="6" />
        <rect x="47.7" y="70" width="4.6" height="11" rx="2.3" />
      </g>
    </svg>
  );
}

function timer(isLocked, lastMs, now) {
  if (!isLocked) return 'Unlocked';
  if (!lastMs) return '—';
  const s = Math.max(0, Math.floor((now - lastMs) / 1000));
  const t = s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`;
  return `Last Unlocked ${t}`;
}

export default function LockStatus({ isLocked = true, lastUnlockedAtMs = 0 }) {
  const now = useSecondTick();
  return (
    <div className="lock-status">
      <LockIcon isLocked={isLocked} />
      <div className="lock-text">{timer(isLocked, lastUnlockedAtMs, now)}</div>
    </div>
  );
}
