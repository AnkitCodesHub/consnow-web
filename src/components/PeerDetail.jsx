import { useEffect } from 'react';
import StepCard from './StepCard';
import LockStatus from './LockStatus';
import { MovementStatus } from './Walking';
import { ConnectionActionButton, disconnectedLine, useEffectiveState } from './FriendCard';
import { firstName, initials, liveStatus } from './status';
import * as Api from '../api/consnow';

/** ConnectionControls.kt DisconnectedPeerPanel */
function DisconnectedPeerPanel({ row, actions }) {
  const { state, now, until } = useEffectiveState(row);
  const first = firstName(row.peer.name) || 'your friend';
  const text = {
    request_received: `${first} wants to connect. Accept to see each other's steps and activity again.`,
    request_sent: `Request sent. You'll both see each other's activity once ${first} accepts.`,
    cooldown: `${first} declined your request. ${disconnectedLine(state, until, now)}.`,
  }[state] ?? `You can't see each other's steps or activity. Connect to ask ${first} to share again.`;
  return (
    <div className="dpanel">
      <span className="dpanel-av">{initials(row.peer.name)}</span>
      <h2>{row.peer.name}</h2>
      <span className="pill disconnect">Disconnected</span>
      <p>{text}</p>
      <ConnectionActionButton row={row} {...actions} />
    </div>
  );
}

/** PeerStepsScreen.kt — StepCard with name, movement status, lock status at the bottom. */
export default function PeerDetail({ row, data = {}, onBack, onRefresh, actions, offline }) {
  const connected = row.state === 'connected';
  const s = liveStatus(data);

  useEffect(() => {
    if (!connected) return;
    onRefresh?.();
    Api.recordProfileView(row.peer.id).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.peer.id, connected]);

  const loading = connected && !data.steps && !data.stepsError;
  const err = connected && !data.steps && data.stepsError;

  return (
    <div className="peer-screen">
      {onBack && <button className="text-btn back" onClick={onBack}>← Back</button>}
      <div className="peer-middle">
        {!connected ? (
          <DisconnectedPeerPanel row={row} actions={actions} />
        ) : loading ? (
          <span className="spinner" aria-label="Loading" />
        ) : err ? (
          <div className="peer-error">
            <div className="pe-title">{offline ? "You're offline" : "Couldn't load"}</div>
            <p>{offline ? `Connect to the internet to see ${firstName(row.peer.name) || 'your friend'}'s activity.`
              : data.stepsError === 'hidden' ? `${row.peer.name} has turned off step sharing.` : 'Something went wrong. Please try again.'}</p>
            <button className="outlined-btn" onClick={onRefresh}>Try again</button>
          </div>
        ) : (
          <>
            <StepCard stepCount={data.steps?.stepCount ?? 0} isActive={!!data.steps?.isActive} name={row.peer.name} />
            <div className="gap16" />
            <MovementStatus isWalking={!!data.steps?.isActive} lastActiveAt={data.steps?.lastActiveAt} />
            {offline && <span className="pill primary mt24">You're offline · pull down to retry</span>}
          </>
        )}
      </div>
      {connected && <LockStatus isLocked={s ? s.isLocked : true} lastUnlockedAtMs={s?.lastUnlockedAtMs ?? 0} />}
    </div>
  );
}
