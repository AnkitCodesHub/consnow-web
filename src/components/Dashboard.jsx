import { useCallback, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useConsnow } from '../hooks/useConsnow';
import { useNow } from '../hooks/useNow';
import * as Api from '../api/consnow';
import { UNDO_MS } from '../config';
import { clockTime, fmt, timeAgo } from '../utils';
import Logo from './Logo';
import Avatar from './Avatar';
import PeerCard from './PeerCard';
import PeerModal from './PeerModal';
import InactiveRow from './InactiveRow';
import AddFriend from './AddFriend';
import { phoneStatus } from './status';

const SORTS = {
  recent: { label: 'Recently active', fn: (a, b) => lastSeen(b) - lastSeen(a) },
  steps: { label: 'Most steps', fn: (a, b) => (b.d.steps?.stepCount ?? -1) - (a.d.steps?.stepCount ?? -1) },
  name: { label: 'Name', fn: (a, b) => a.row.peer.name.localeCompare(b.row.peer.name) },
};
function lastSeen({ d }) {
  const t = [d.steps?.isActive ? Date.now() : 0, Date.parse(d.steps?.lastActiveAt || 0) || 0,
    d.activity?.isLocked === false && d.activity?.isOnline ? Date.now() : 0, Date.parse(d.activity?.unlockedAt || 0) || 0];
  return Math.max(...t);
}

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const now = useNow();
  const c = useConsnow(token);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [openId, setOpenId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [copied, setCopied] = useState(false);
  const undoTimer = useRef(null);

  const toast = useCallback((msg, kind = 'info', action) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? UNDO_MS : 3500);
    return id;
  }, []);
  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const connected = useMemo(() => c.rows.filter((r) => r.state === 'connected'), [c.rows]);
  const inactive = useMemo(() => c.rows.filter((r) => r.state !== 'connected'), [c.rows]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return connected
      .filter((r) => !q || r.peer.name.toLowerCase().includes(q))
      .map((row) => ({ row, d: c.live[row.peer.id] || {} }))
      .sort(SORTS[sort].fn);
  }, [connected, c.live, query, sort]);

  const stats = useMemo(() => {
    const ds = connected.map((r) => c.live[r.peer.id] || {});
    return {
      onPhone: ds.filter((d) => phoneStatus(d.activity).key === 'unlocked').length,
      walking: ds.filter((d) => d.steps?.isActive).length,
    };
  }, [connected, c.live]);

  const openRow = connected.find((r) => r.peer.id === openId);

  const disconnect = async (row) => {
    setOpenId(null);
    // Optimistic: drop the card immediately, like the app does.
    c.setRows((rows) => rows.map((r) => (r.peer.id === row.peer.id ? { ...r, state: 'disconnected', disconnectedByMe: true } : r)));
    try {
      await Api.disconnectPeer(row.peer.id);
      clearTimeout(undoTimer.current);
      const tid = toast(`Disconnected from ${row.peer.name}`, 'info', {
        label: 'Undo',
        run: async () => {
          dismiss(tid);
          try { await Api.undoDisconnect(row.peer.id); toast(`Reconnected with ${row.peer.name}`); }
          catch (e) { toast(e.message, 'error'); }
          c.refreshAll();
        },
      });
    } catch (e) {
      toast(e.message, 'error');
    }
    c.loadRows();
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(user?.connectionCode ?? ''); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { toast('Copy failed — select the code manually', 'error'); }
  };

  const myStatus = phoneStatus(c.me.activity);

  return (
    <div className="app">
      <header className="topbar">
        <Logo />
        <div className={`live-chip ${c.socketState}`} title={c.lastSync ? `Last refresh ${clockTime(c.lastSync)}` : ''}>
          <span className="dot" />{c.socketState === 'live' ? 'Live' : c.socketState === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
        </div>
        <div className="spacer" />
        <button className="btn ghost sm" onClick={c.refreshAll} title="Refresh now">↻ Refresh</button>
        <div className="me-chip">
          <Avatar id={user?.id} name={user?.name} size={30} />
          <span className="hide-sm">{user?.name}</span>
          <button className="link" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="layout">
        <aside className="side">
          <section className="card me-card">
            <div className="label">Your code</div>
            <button className="code" onClick={copyCode} title="Copy">
              {user?.connectionCode ?? '------'}<span className="copy">{copied ? 'Copied ✓' : 'Copy'}</span>
            </button>
            <p className="muted small">Friends enter this code in their app to connect with you.</p>
            <div className="divider" />
            <div className="label">Add a friend</div>
            <AddFriend toast={toast} onDone={c.refreshAll} />
          </section>

          <section className="card me-card">
            <div className="label">You today</div>
            <div className="me-steps"><b>{fmt(c.me.steps?.stepCount)}</b> steps</div>
            <div className="muted small">
              Phone: {myStatus.label.replace('Phone ', '').replace('Using phone', 'in use')}
              {c.me.activity?.unlockedAt && <> · unlocked {timeAgo(c.me.activity.unlockedAt, now)}</>}
            </div>
            {c.viewers.length > 0 && (
              <>
                <div className="divider" />
                <div className="label">Checked on you today</div>
                <ul className="viewers">
                  {c.viewers.map((v) => (
                    <li key={v.viewerId}><Avatar id={v.viewerId} name={v.name} size={26} /> {v.name}<span className="muted small"> · {timeAgo(v.viewedAt, now)}</span></li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {inactive.length > 0 && (
            <section className="card">
              <div className="label">
                Not connected
                {c.requests.length > 0 && <span className="badge">{c.requests.length} new</span>}
              </div>
              {inactive.map((r) => (
                <InactiveRow key={r.peer.id} row={r} now={now} toast={toast} onChanged={c.refreshAll} />
              ))}
            </section>
          )}
        </aside>

        <section className="main">
          <div className="main-head">
            <div>
              <h1>Your people</h1>
              <p className="muted">
                {connected.length} connected · {stats.onPhone} on their phone · {stats.walking} walking
              </p>
            </div>
            <div className="controls">
              <input className="search" placeholder="Search friends" value={query} onChange={(e) => setQuery(e.target.value)} />
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
                {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {c.requests.length > 0 && (
            <div className="banner">
              <b>{c.requests.map((r) => r.from.name).join(', ')}</b> {c.requests.length === 1 ? 'wants' : 'want'} to connect — see “Not connected”.
            </div>
          )}
          {c.error && <div className="banner error">{c.error} <button className="link" onClick={c.refreshAll}>Try again</button></div>}

          {c.loading ? (
            <div className="grid">{[0, 1, 2].map((i) => <div key={i} className="card peer skeleton" />)}</div>
          ) : connected.length === 0 ? (
            <div className="empty card">
              <Logo size={48} withText={false} />
              <h3>No one connected yet</h3>
              <p className="muted">Share your code <b>{user?.connectionCode}</b> or enter a friend’s code on the left.</p>
            </div>
          ) : shown.length === 0 ? (
            <p className="muted">No friend matches “{query}”.</p>
          ) : (
            <div className="grid">
              {shown.map(({ row, d }) => (
                <PeerCard key={row.peer.id} row={row} data={d} now={now} onOpen={() => setOpenId(row.peer.id)} />
              ))}
            </div>
          )}
        </section>
      </main>

      {openRow && (
        <PeerModal row={openRow} data={c.live[openRow.peer.id]} now={now}
          onClose={() => setOpenId(null)} onDisconnect={disconnect} />
      )}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <span>{t.msg}</span>
            {t.action && <button className="link" onClick={t.action.run}>{t.action.label}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
