import Avatar from './Avatar';
import { phoneStatus } from './status';
import { clockTime, fmt, timeAgo } from '../utils';

export default function PeerCard({ row, data = {}, now, onOpen }) {
  const { peer } = row;
  const steps = data.steps;
  const act = data.activity;
  const hidden = data.stepsError === 'hidden' || peer.sharingEnabled === false;
  const status = phoneStatus(act);
  const walking = steps?.isActive;
  const loading = !steps && !act && !data.stepsError && !data.activityError;

  return (
    <button className={`card peer ${walking ? 'is-walking' : ''}`} onClick={onOpen}>
      {data.flash && <span className="flash" key={data.flash} />}
      <div className="peer-head">
        <Avatar id={peer.id} name={peer.name} status={status.key} />
        <div className="peer-name">
          <strong>{peer.name}</strong>
          <span className={`pill ${status.key}`}><span className="dot" />{status.label}</span>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-block" />
      ) : hidden ? (
        <div className="paused">Sharing paused by {peer.name.split(' ')[0]}</div>
      ) : (
        <>
          <div className="steps-big">
            <span className="num">{fmt(steps?.stepCount)}</span>
            <span className="unit">steps today</span>
          </div>
          <dl className="facts">
            <div>
              <dt>Last active</dt>
              <dd>{walking ? <span className="walking">● Walking now</span> : timeAgo(steps?.lastActiveAt, now) ?? '—'}</dd>
            </div>
            <div>
              <dt>Last unlocked</dt>
              <dd>{act?.unlockedAt ? <>{clockTime(act.unlockedAt)} <span className="muted">· {timeAgo(act.unlockedAt, now)}</span></> : '—'}</dd>
            </div>
          </dl>
        </>
      )}
    </button>
  );
}
