import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL, ACTIVITY_POLL_MS, STEPS_POLL_MS } from '../config';
import * as Api from '../api/consnow';
import { localDate } from '../utils';

/**
 * All live data for the signed-in user:
 *  - rows:     friends list incl. disconnected / requested rows (with `state`)
 *  - live:     { [peerId]: { steps, activity, error } } — only for connected friends
 *  - me:       own steps + activity
 *  - requests: incoming Connect requests
 * Live updates come from the same Socket.IO gateway the Android app uses;
 * steps are polled because the server doesn't push step counts.
 */
export function useConsnow(token) {
  const [rows, setRows] = useState([]);
  const [live, setLive] = useState({});
  const [me, setMe] = useState({ steps: null, activity: null });
  const [requests, setRequests] = useState([]);
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketState, setSocketState] = useState('connecting');
  const [lastSync, setLastSync] = useState(null);

  const rowsRef = useRef([]);
  rowsRef.current = rows;
  const dayRef = useRef(localDate());

  const patchLive = useCallback((peerId, patch) => {
    setLive((prev) => {
      const cur = prev[peerId] || {};
      const next = typeof patch === 'function' ? patch(cur) : { ...cur, ...patch };
      return { ...prev, [peerId]: next };
    });
  }, []);

  const connectedIds = () =>
    rowsRef.current.filter((r) => r.state === 'connected').map((r) => r.peer.id);

  const loadPeer = useCallback(async (peerId, { steps = true, activity = true } = {}) => {
    const [s, a] = await Promise.allSettled([
      steps ? Api.getPeerSteps(peerId) : Promise.resolve(undefined),
      activity ? Api.getPeerActivity(peerId) : Promise.resolve(undefined),
    ]);
    patchLive(peerId, (cur) => {
      const next = { ...cur };
      if (steps) {
        if (s.status === 'fulfilled') { next.steps = s.value; next.stepsError = null; }
        else next.stepsError = s.reason?.status === 403 ? 'hidden' : 'error';
      }
      if (activity) {
        if (a.status === 'fulfilled') { next.activity = a.value; next.activityError = null; }
        else next.activityError = a.reason?.status === 403 ? 'hidden' : 'error';
      }
      return next;
    });
  }, [patchLive]);

  const loadMe = useCallback(async () => {
    const [s, a] = await Promise.allSettled([Api.getMySteps(), Api.getMyActivity()]);
    setMe((cur) => ({
      steps: s.status === 'fulfilled' ? s.value : cur.steps,
      activity: a.status === 'fulfilled' ? a.value : cur.activity,
    }));
  }, []);

  const loadRows = useCallback(async () => {
    const [list, reqs] = await Promise.all([Api.getConnections(), Api.getRequests().catch(() => [])]);
    const sorted = [...(list || [])].sort((a, b) => {
      const order = { connected: 0, request_received: 1, request_sent: 2, cooldown: 3, disconnected: 4 };
      return (order[a.state] ?? 9) - (order[b.state] ?? 9) || a.peer.name.localeCompare(b.peer.name);
    });
    setRows(sorted);
    rowsRef.current = sorted;
    setRequests(reqs || []);
    // Consent: wipe anything cached for friends who are no longer connected.
    const ok = new Set(sorted.filter((r) => r.state === 'connected').map((r) => r.peer.id));
    setLive((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => ok.has(id))));
    return sorted;
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      setError(null);
      const list = await loadRows();
      await Promise.all([
        loadMe(),
        Api.getProfileViewers().then(setViewers).catch(() => {}),
        ...list.filter((r) => r.state === 'connected').map((r) => loadPeer(r.peer.id)),
      ]);
      setLastSync(new Date().toISOString());
    } catch (e) {
      if (e.status !== 401) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [loadRows, loadMe, loadPeer]);

  // Initial load
  useEffect(() => { if (token) refreshAll(); }, [token, refreshAll]);

  // Poll steps (and roll over at midnight)
  useEffect(() => {
    if (!token) return;
    const id = setInterval(async () => {
      if (dayRef.current !== localDate()) {
        dayRef.current = localDate();
        refreshAll();
        return;
      }
      await Promise.all([
        loadMe(),
        ...connectedIds().map((pid) => loadPeer(pid, { steps: true, activity: false })),
      ]);
      setLastSync(new Date().toISOString());
    }, STEPS_POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loadMe, loadPeer, refreshAll]);

  // Safety-net poll for lock/online state (heartbeat-based "offline" has no socket event)
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      connectedIds().forEach((pid) => loadPeer(pid, { steps: false, activity: true }));
    }, ACTIVITY_POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loadPeer]);

  // Refresh when the tab becomes visible again
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible' && token) refreshAll(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [token, refreshAll]);

  // Socket.IO — same gateway + events as the Android SocketManager
  useEffect(() => {
    if (!token) return;
    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
    });
    setSocketState('connecting');
    socket.on('connect', () => setSocketState('live'));
    socket.on('disconnect', () => setSocketState('offline'));
    socket.io.on('reconnect_attempt', () => setSocketState('connecting'));
    socket.io.on('reconnect', () => refreshAll());

    const isConnected = (id) => connectedIds().includes(id);

    socket.on('peer_unlocked', ({ userId, unlockedAt }) => {
      if (!isConnected(userId)) return;
      patchLive(userId, (cur) => ({
        ...cur,
        activity: { ...(cur.activity || {}), userId, unlockedAt, isLocked: false, isOnline: true },
        flash: Date.now(),
      }));
    });
    socket.on('peer_locked', ({ userId }) => {
      if (!isConnected(userId)) return;
      patchLive(userId, (cur) => ({
        ...cur,
        activity: { ...(cur.activity || {}), userId, isLocked: true },
        flash: Date.now(),
      }));
    });
    socket.on('peer_activity', ({ userId, isActive, lastActiveAt }) => {
      if (!isConnected(userId)) return;
      patchLive(userId, (cur) => ({
        ...cur,
        steps: { ...(cur.steps || {}), isActive, lastActiveAt: lastActiveAt ?? cur.steps?.lastActiveAt },
        flash: Date.now(),
      }));
      // Walking started/stopped → fetch the fresh step count too
      loadPeer(userId, { steps: true, activity: false });
    });
    socket.on('connection_changed', () => { refreshAll(); });

    return () => { socket.removeAllListeners(); socket.io.removeAllListeners(); socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const refreshViewers = useCallback(() => { Api.getProfileViewers().then(setViewers).catch(() => {}); }, []);

  return {
    refreshViewers,
    rows, setRows, live, me, requests, viewers, loading, error, socketState, lastSync,
    refreshAll, loadRows, loadPeer,
  };
}
