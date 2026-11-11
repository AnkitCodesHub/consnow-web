import { useEffect, useState } from 'react';
import { ConnectionActionButton } from './FriendCard';
import { formatRemaining } from './status';
import { useSecondTick } from './Walking';
import { OutlinedField, FilledButton } from './Material';
import * as Api from '../api/consnow';

function Sheet({ onClose, children, className = '' }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className={`sheet ${className}`} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

/** ConnectScreen.kt */
export function ConnectSheet({ onClose, onDone }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const connect = async () => {
    if (code.length !== 6 || busy) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const r = await Api.connectByCode(code);
      const name = r?.peer?.name ?? 'your friend';
      setSuccess(r?.state === 'request_sent' ? `Request sent to ${name}` : `Connected with ${name}!`);
      onDone();
    } catch (e) {
      setError(e.status === 0 ? "You're offline. Connect to the internet and try again." : e.message);
    } finally { setBusy(false); }
  };

  return (
    <Sheet onClose={onClose} className="connect-sheet">
      <button className="text-btn back" onClick={onClose}>← Back</button>
      <div className="connect-body">
        <h1 className="headline primary">Connect</h1>
        <p className="body-m muted center">Enter the 6-character code from the person whose steps you want to see.</p>
        <form onSubmit={(e) => { e.preventDefault(); connect(); }}>
          <OutlinedField label="Connection code" value={code} autoFocus big
            onChange={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} />
          {error && <p className="field-msg error">{error}</p>}
          {success && <p className="field-msg success">{success}</p>}
          <FilledButton disabled={code.length !== 6 || busy} busy={busy}>Connect</FilledButton>
        </form>
      </div>
    </Sheet>
  );
}

/** ConnectionControls.kt RequestsScreen */
export function RequestsSheet({ requests, onClose, onChanged, toast }) {
  const now = useSecondTick();
  const run = async (fn, msg) => {
    try { await fn(); if (msg) toast(msg); } catch (e) { toast(e.message); }
    onChanged();
  };
  return (
    <Sheet onClose={onClose} className="requests-sheet">
      <button className="text-btn back" onClick={onClose}>← Back</button>
      <h1 className="screen-title">Requests</h1>
      <p className="body-m muted">People who want to see your activity again. Requests expire after 24 hours.</p>
      <div className="gap20" />
      {requests.length === 0 && <div className="empty-box">No requests right now</div>}
      {requests.map((r) => (
        <div key={r.id} className="request-row">
          <div className="grow">
            <div className="fc-name">{r.from.name}</div>
            <div className="fc-line neutral">Wants to connect · expires in {formatRemaining(Date.parse(r.expiresAt) - now)}</div>
          </div>
          <ConnectionActionButton
            row={{ peer: { id: r.from.id, name: r.from.name }, state: 'request_received', requestId: r.id }}
            onAccept={() => run(() => Api.acceptRequest(r.id), `Connected with ${r.from.name.split(' ')[0]}`)}
            onDecline={() => run(() => Api.declineRequest(r.id))} />
        </div>
      ))}
    </Sheet>
  );
}
