import { useEffect, useRef, useState } from 'react';
import { Eye } from './Icons';
import { firstName, timeAgoShort } from './status';

const HOLD_MS = 600;

/**
 * Home step card: press and hold (600 ms) to see who opened your profile today — like the app.
 * Card shrinks while pressed and pops out while the list is showing.
 */
export default function WhosWatching({ watchers = [], onShow, children }) {
  const [pressed, setPressed] = useState(false);
  const [held, setHeld] = useState(false);
  const timer = useRef(null);

  const down = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    setPressed(true);
    timer.current = setTimeout(() => { setHeld(true); onShow?.(); navigator.vibrate?.(40); }, HOLD_MS);
  };
  const up = () => { clearTimeout(timer.current); setPressed(false); setHeld(false); };
  useEffect(() => () => clearTimeout(timer.current), []);

  const rows = [...watchers].sort((a, b) => Date.parse(b.viewedAt) - Date.parse(a.viewedAt)).slice(0, 3);
  const scale = held ? 1.04 : pressed ? 0.96 : 1;

  return (
    <div className="watch-wrap">
      <div className="watch-card" style={{ transform: `scale(${scale})` }}
        onPointerDown={down} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
        onContextMenu={(e) => e.preventDefault()} title="Press and hold to see who viewed your profile today">
        {children}
      </div>
      <div className={`watch-popup ${held ? 'show' : ''}`} role="dialog" aria-hidden={!held}>
        <span className="eye-bubble"><Eye size={18} /></span>
        <div className="watch-div" />
        {rows.length === 0 ? (
          <p className="watch-empty">No one has looked at your profile yet today.</p>
        ) : rows.map((w) => {
          const n = firstName(w.name);
          return (
            <div className="watch-row" key={w.viewerId}>
              <span className="watch-av">{n.slice(0, 1).toUpperCase()}</span>
              <div><b>{n}</b><span>{timeAgoShort(Date.parse(w.viewedAt))}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
