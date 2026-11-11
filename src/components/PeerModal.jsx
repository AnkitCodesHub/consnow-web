import { useEffect } from 'react';
import Avatar from './Avatar';
import { phoneStatus } from './status';
import * as Api from '../api/consnow';
import { clockTime, fmt, timeAgo } from '../utils';

export default function PeerModal({ row, data = {}, now, onClose, onDisconnect }) {
  const { peer } = row;
  const steps = data.steps;
  const act = data.activity;
  const status = phoneStatus(act);
  const hidden = data.stepsError === 'hidden' || peer.sharingEnabled === false;

  // Same as opening a friend's profile in the app: they see you checked in today.
  useEffect(() => { Api.recordProfileView(peer.id).catch(() => {}); }, [peer.id]);
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-label={peer.name} onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-head">
          <Avatar id={peer.id} name={peer.name} size={64} status={status.key} />
          <div>
            <h2>{peer.name}</h2>
            <span className={`pill ${status.key}`}><span className="dot" />{status.label}</span>
          </div>
        </div>

        {hidden ? (
          <div className="paused big">{peer.name.split(' ')[0]} has paused sharing. Nothing to show right now.</div>
        ) : (
          <div className="stat-grid">
            <div className="stat"><span>Steps today</span><b>{fmt(steps?.stepCount)}</b></div>
            <div className="stat"><span>Last active</span><b>{steps?.isActive ? 'Walking now' : timeAgo(steps?.lastActiveAt, now) ?? '—'}</b>
              {steps?.lastActiveAt && !steps?.isActive && <em>{clockTime(steps.lastActiveAt)}</em>}</div>
            <div className="stat"><span>Phone</span><b>{status.key === 'unlocked' ? 'Unlocked' : status.key === 'locked' ? 'Locked' : status.key === 'offline' ? 'Offline' : '—'}</b>
              {status.key === 'offline' && <em>No signal for 90 s+</em>}</div>
            <div className="stat"><span>Last unlocked</span><b>{clockTime(act?.unlockedAt)}</b>
              {act?.unlockedAt && <em>{timeAgo(act.unlockedAt, now)}</em>}</div>
          </div>
        )}

        <div className="modal-foot">
          <span className="muted small">Steps last synced {timeAgo(steps?.updatedAt, now) ?? '—'}</span>
          <button className="btn danger-ghost" onClick={() => onDisconnect(row)}>Disconnect</button>
        </div>
      </div>
    </div>
  );
}
