import { useEffect, useState } from 'react';
import { PersonAdd, PersonRemove, Clock, Close, Check } from './Icons';
import { firstName, formatRemaining, friendStatusLine, initials, javaHash } from './status';

/** COOLDOWN whose time has run out behaves like DISCONNECTED (ConnectionControls.effectiveStatus). */
export function useEffectiveState(row) {
  const [now, setNow] = useState(Date.now());
  const until = row.cooldownUntil ? Date.parse(row.cooldownUntil) : null;
  useEffect(() => {
    if (!until || now >= until) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [until, now]);
  const state = row.state === 'cooldown' && (until ?? 0) <= now ? 'disconnected' : row.state;
  return { state, now, until };
}

export function disconnectedLine(state, until, now) {
  switch (state) {
    case 'request_received': return 'Wants to connect';
    case 'request_sent': return 'Request sent · waiting';
    case 'cooldown': return `Try again in ${formatRemaining((until ?? now) - now)}`;
    default: return 'Disconnected';
  }
}

function RoundIconButton({ icon, kind, filled, label, onClick, disabled }) {
  return (
    <button type="button" className={`round-btn ${kind} ${filled ? 'filled' : 'tinted'}`} aria-label={label} title={label}
      disabled={disabled} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      {icon}
    </button>
  );
}

/** The button on the right of each friend row (design option C "person", soft). */
export function ConnectionActionButton({ row, onDisconnect, onConnect, onCancel, onAccept, onDecline }) {
  const { state } = useEffectiveState(row);
  const first = firstName(row.peer.name) || 'friend';
  switch (state) {
    case 'connected':
      return <RoundIconButton icon={<PersonRemove />} kind="disconnect" label={`Disconnect from ${first}`} onClick={onDisconnect} />;
    case 'disconnected':
      return <RoundIconButton icon={<PersonAdd />} kind="connect" filled label={`Connect with ${first}`} onClick={onConnect} />;
    case 'request_sent':
      return <RoundIconButton icon={<Clock />} kind="neutral" label={`Request sent to ${first}. Tap to cancel`} onClick={onCancel} />;
    case 'request_received':
      return (
        <div className="btn-pair">
          <RoundIconButton icon={<Close />} kind="neutral" label={`Decline request from ${first}`} onClick={onDecline} />
          <RoundIconButton icon={<Check />} kind="connect" filled label={`Accept request from ${first}`} onClick={onAccept} />
        </div>
      );
    case 'cooldown':
      return <RoundIconButton icon={<Clock />} kind="neutral" disabled label={`${first} declined. You can ask again later`} />;
    default:
      return null;
  }
}

/** HomeScreen.kt FriendCard */
export default function FriendCard({ row, status, selected, onClick, actions }) {
  const connected = row.state === 'connected';
  const { state, now, until } = useEffectiveState(row);
  const isOnline = connected && status?.isUserActive === true;
  const line = connected ? friendStatusLine(status) : disconnectedLine(state, until, now);
  const lineCls = !connected ? (state === 'request_received' ? 'online' : 'muted') : !status ? 'muted' : isOnline ? 'online' : 'offline';
  const dotCls = !connected || !status ? 'checking' : isOnline ? 'online' : 'offline';
  const av = (javaHash(row.peer.id) & 0x7fffffff) % 4;

  return (
    <div className={`friend-card ${selected ? 'selected' : ''}`} role="button" tabIndex={0} onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick())}>
      <div className="fc-avatar">
        <span className={`fc-circle ${isOnline ? `av${av}` : 'av-off'}`}>{initials(row.peer.name)}</span>
        <span className={`fc-halo ${isOnline ? 'on' : ''}`}><span className={`fc-dot ${dotCls}`} aria-label={!connected ? 'Not connected' : isOnline ? 'Active' : 'Inactive'} /></span>
      </div>
      <div className="fc-text">
        <div className="fc-name">{row.peer.name}</div>
        <div className={`fc-line ${lineCls}`}>{line}</div>
      </div>
      <ConnectionActionButton row={row} {...actions} />
    </div>
  );
}
