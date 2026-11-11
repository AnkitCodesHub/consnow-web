import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useConsnow } from '../hooks/useConsnow';
import * as Api from '../api/consnow';
import { APP_VERSION, PRIVACY_URL, UNDO_MS } from '../config';
import Logo from './Logo';
import StepCard from './StepCard';
import LockStatus from './LockStatus';
import WhosWatching from './WhosWatching';
import FriendCard from './FriendCard';
import PeerDetail from './PeerDetail';
import { MovementStatus } from './Walking';
import { ConnectSheet, RequestsSheet } from './Sheets';
import { AlertDialog } from './Material';
import { firstName, liveStatus } from './status';

function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    window.addEventListener('online', a); window.addEventListener('offline', b);
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); };
  }, []);
  return on;
}

function useWide() {
  const q = '(min-width: 1180px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q), f = () => setWide(m.matches);
    m.addEventListener('change', f); return () => m.removeEventListener('change', f);
  }, []);
  return wide;
}

/** HomeScreen.kt, laid out for a laptop: you | friends | selected friend. */
export default function Home() {
  const { token, user, logout } = useAuth();
  const c = useConsnow(token);
  const online = useOnline();
  const wide = useWide();
  const [selectedId, setSelectedId] = useState(null);
  const [sheet, setSheet] = useState(null); // 'connect' | 'requests'
  const [snack, setSnack] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const snackTimer = useRef(null);

  const toast = useCallback((message, action) => {
    clearTimeout(snackTimer.current);
    setSnack({ message, action, id: Date.now() });
    snackTimer.current = setTimeout(() => setSnack(null), action ? UNDO_MS : 4000);
  }, []);

  // Friends split like the app: Active now / Inactive / Not connected
  const { activeNow, inactive, notConnected } = useMemo(() => {
    const connected = c.rows.filter((r) => r.state === 'connected');
    const nc = c.rows.filter((r) => r.state !== 'connected')
      .sort((a, b) => (a.state === 'request_received' ? 0 : 1) - (b.state === 'request_received' ? 0 : 1));
    const on = [], off = [];
    connected.forEach((r) => (liveStatus(c.live[r.peer.id])?.isUserActive ? on : off).push(r));
    return { activeNow: on, inactive: off, notConnected: nc };
  }, [c.rows, c.live]);

  const selected = c.rows.find((r) => r.peer.id === selectedId) ?? null;

  // Laptop: open the first friend so the right side is never empty.
  useEffect(() => {
    if (wide && !selectedId && c.rows.length) setSelectedId((activeNow[0] ?? inactive[0] ?? c.rows[0]).peer.id);
  }, [wide, selectedId, c.rows, activeNow, inactive]);

  const refresh = c.refreshAll;
  const actionsFor = (row) => ({
    onDisconnect: async () => {
      c.setRows((rows) => rows.map((r) => (r.peer.id === row.peer.id ? { ...r, state: 'disconnected' } : r)));
      try {
        await Api.disconnectPeer(row.peer.id);
        toast(`Disconnected from ${firstName(row.peer.name)}`, {
          label: 'Undo',
          run: async () => {
            setSnack(null);
            try { await Api.undoDisconnect(row.peer.id); } catch (e) { toast(e.message); }
            refresh();
          },
        });
      } catch (e) { toast(e.message); }
      c.loadRows();
    },
    onConnect: async () => {
      try {
        const r = await Api.requestConnect(row.peer.id);
        toast(r?.state === 'connected' ? `Connected with ${firstName(row.peer.name)}` : `Request sent to ${firstName(row.peer.name)}`);
      } catch (e) { toast(e.body?.cooldownUntil ? 'Request was declined. You can ask again later.' : e.message); }
      refresh();
    },
    onCancel: async () => {
      try { await Api.cancelRequest(row.requestId); toast('Request cancelled'); } catch (e) { toast(e.message); }
      refresh();
    },
    onAccept: async () => {
      try { await Api.acceptRequest(row.requestId); toast(`Connected with ${firstName(row.peer.name)}`); } catch (e) { toast(e.message); }
      refresh();
    },
    onDecline: async () => {
      try { await Api.declineRequest(row.requestId); } catch (e) { toast(e.message); }
      refresh();
    },
  });

  const me = c.me;
  const ownLocked = me.activity ? (!me.activity.isOnline ? true : me.activity.isLocked !== false) : true;
  const ownUnlockMs = me.activity?.unlockedAt ? Date.parse(me.activity.unlockedAt) : 0;
  const syncedAgoMin = me.steps?.updatedAt ? (Date.now() - Date.parse(me.steps.updatedAt)) / 60000 : null;
  const sync = !online ? { text: "You're offline", cls: 'muted' }
    : syncedAgoMin == null ? { text: 'Waiting to sync', cls: 'muted' }
    : syncedAgoMin < 5 ? { text: 'Synced', cls: 'primary' }
    : { text: 'Waiting for your phone to sync', cls: 'muted' };

  const friendsList = (
    <section className="friends-col">
      <div className="friends-head">
        <div>
          <h2 className="friends-title">Friends</h2>
          {(activeNow.length + inactive.length) > 0 && (
            <div className="friends-counts">
              <span className="cdot online" />{activeNow.length} active
              <span className="cdot offline" />{inactive.length} inactive
            </div>
          )}
        </div>
        <div className="friends-actions">
          {c.requests.length > 0 && (
            <button className="req-badge" onClick={() => setSheet('requests')} aria-label={`${c.requests.length} connect requests`}>
              <span>🔔</span><b>{c.requests.length}</b>
            </button>
          )}
          <button className="add-btn" onClick={() => setSheet('connect')} aria-label="Add friend" title="Add friend">+</button>
        </div>
      </div>

      {c.loading ? (
        <div className="list-loading"><span className="spinner" /></div>
      ) : c.rows.length === 0 ? (
        <div className="empty-box">No connections yet.<br />Tap + to enter someone's code.</div>
      ) : (
        <>
          {[['Active now', activeNow], ['Inactive', inactive], ['Not connected', notConnected]].map(([label, list]) =>
            list.length > 0 && (
              <div key={label}>
                <div className="section-label">{label}</div>
                {list.map((row) => (
                  <FriendCard key={row.peer.id} row={row}
                    status={row.state === 'connected' ? liveStatus(c.live[row.peer.id]) : null}
                    selected={wide && row.peer.id === selectedId}
                    onClick={() => setSelectedId(row.peer.id)} actions={actionsFor(row)} />
                ))}
              </div>
            ))}
        </>
      )}
    </section>
  );

  const youTop = (
    <>
      {!online && <span className="pill primary">You're offline · connect to the internet to see live updates</span>}
      <div className="label-l muted">Today's Steps</div>
      <WhosWatching watchers={c.viewers} onShow={c.refreshViewers}>
        <StepCard stepCount={me.steps?.stepCount ?? 0} isActive={!!me.steps?.isActive} watchersHint />
      </WhosWatching>
      <button className={`pill ${sync.cls}`} onClick={refresh} title="Refresh now">{sync.text}</button>
      <MovementStatus isWalking={!!me.steps?.isActive} lastActiveAt={me.steps?.lastActiveAt} walkerHeight={56} />
      <LockStatus isLocked={ownLocked} lastUnlockedAtMs={ownUnlockMs} />
      {user?.connectionCode && (
        <div className="code-block">
          <div className="label-s muted">Your code</div>
          <button className="my-code" title="Click to copy"
            onClick={() => navigator.clipboard?.writeText(user.connectionCode).then(() => toast('Code copied'), () => {})}>
            {user.connectionCode}
          </button>
          <p className="body-m muted center">Share this code so someone can see your steps</p>
        </div>
      )}
    </>
  );

  const footer = (
      <div className="footer-links">
        <button className="text-btn error" onClick={logout}>Sign out</button>
        <button className="text-btn error" onClick={() => setConfirmDelete(true)}>Delete Account</button>
        <a className="text-btn muted" href={PRIVACY_URL} target="_blank" rel="noreferrer">Privacy Policy</a>
        <div className="version">Consnow Web v{APP_VERSION}</div>
      </div>
  );

  const detail = selected && (
    <PeerDetail key={selected.peer.id} row={selected} data={c.live[selected.peer.id]} offline={!online}
      onBack={wide ? null : () => setSelectedId(null)}
      onRefresh={() => c.loadPeer(selected.peer.id)} actions={actionsFor(selected)} />
  );

  return (
    <div className="home">
      <header className="home-bar">
        <span className="brand"><Logo size={30} /><span>Consnow</span></span>
        <span className={`live ${c.socketState}`} title="Live updates">
          <span className="ldot" />{c.socketState === 'live' ? 'Live' : 'Connecting…'}
        </span>
      </header>

      {wide ? (
        <main className="three-col">
          <section className="you-col">{youTop}{footer}</section>
          {friendsList}
          <section className="detail-col">{detail ?? <div className="detail-empty">Select a friend to see their steps and phone status</div>}</section>
        </main>
      ) : selected ? (
        <main className="single">{detail}</main>
      ) : (
        <main className="single"><section className="you-col">{youTop}</section>{friendsList}{footer}</main>
      )}

      {sheet === 'connect' && <ConnectSheet onClose={() => setSheet(null)} onDone={refresh} />}
      {sheet === 'requests' && <RequestsSheet requests={c.requests} onClose={() => setSheet(null)} onChanged={refresh} toast={toast} />}
      {confirmDelete && (
        <AlertDialog title="Delete Account" danger confirmLabel="Delete"
          text="This will permanently delete your account and all your data. This cannot be undone."
          onDismiss={() => setConfirmDelete(false)}
          onConfirm={async () => {
            setConfirmDelete(false);
            try { await Api.deleteAccount(); logout(); } catch (e) { toast(e.message); }
          }} />
      )}

      {snack && (
        <div className="snackbar" key={snack.id} role="status">
          <span>{snack.message}</span>
          {snack.action && <button onClick={snack.action.run}>{snack.action.label}</button>}
        </div>
      )}
    </div>
  );
}
