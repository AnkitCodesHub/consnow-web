import { useState } from 'react';
import Avatar from './Avatar';
import * as Api from '../api/consnow';
import { untilText } from '../utils';

const LABEL = {
  disconnected: 'Disconnected',
  request_sent: 'Request sent',
  request_received: 'Wants to connect',
  cooldown: 'Request declined',
};

/** A friend who isn't connected right now. No data is shown (consent). */
export default function InactiveRow({ row, now, onChanged, toast }) {
  const [busy, setBusy] = useState(false);
  const { peer, state } = row;

  const run = async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); if (okMsg) toast(okMsg); }
    catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); onChanged(); }
  };

  return (
    <div className="inactive-row">
      <Avatar id={peer.id} name={peer.name} size={36} />
      <div className="grow">
        <strong>{peer.name}</strong>
        <span className="muted small">
          {LABEL[state] ?? 'Disconnected'}
          {state === 'request_sent' && row.requestExpiresAt && ` · expires in ${untilText(row.requestExpiresAt, now)}`}
        </span>
      </div>
      {state === 'disconnected' && (
        <button className="btn sm" disabled={busy} onClick={() => run(() => Api.requestConnect(peer.id), `Request sent to ${peer.name}`)}>Connect</button>
      )}
      {state === 'request_sent' && (
        <button className="btn sm ghost" disabled={busy} onClick={() => run(() => Api.cancelRequest(row.requestId), 'Request cancelled')}>Cancel request</button>
      )}
      {state === 'request_received' && (
        <div className="row-actions">
          <button className="btn sm ghost" disabled={busy} onClick={() => run(() => Api.declineRequest(row.requestId))}>Decline</button>
          <button className="btn sm primary" disabled={busy} onClick={() => run(() => Api.acceptRequest(row.requestId), `Connected with ${peer.name}`)}>Accept</button>
        </div>
      )}
      {state === 'cooldown' && (
        <button className="btn sm" disabled>Try again in {untilText(row.cooldownUntil, now)}</button>
      )}
    </div>
  );
}
