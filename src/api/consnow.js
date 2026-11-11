import { api } from './client';
import { localDate, startOfLocalDayIso } from '../utils';

// ── Auth ─────────────────────────────────────────
export const login = (email, password) =>
  api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
export const register = (name, email, password) =>
  api('/auth/register', { method: 'POST', body: { name, email, password }, auth: false });
export const refreshToken = () => api('/auth/refresh', { method: 'POST' });

// ── Connections ──────────────────────────────────
export const getConnections = () => api('/connections?include=disconnected');
export const connectByCode = (connectionCode) =>
  api('/connections', { method: 'POST', body: { connectionCode } });
export const getRequests = () => api('/connections/requests');
export const acceptRequest = (id) => api(`/connections/requests/${id}/accept`, { method: 'POST' });
export const declineRequest = (id) => api(`/connections/requests/${id}/decline`, { method: 'POST' });
export const cancelRequest = (id) => api(`/connections/requests/${id}`, { method: 'DELETE' });
export const disconnectPeer = (peerId) => api(`/connections/${peerId}/disconnect`, { method: 'POST' });
export const undoDisconnect = (peerId) => api(`/connections/${peerId}/undo-disconnect`, { method: 'POST' });
export const requestConnect = (peerId) => api(`/connections/${peerId}/request`, { method: 'POST' });

// ── Steps & activity ─────────────────────────────
export const getMySteps = () => api(`/steps/me?date=${localDate()}`);
export const getPeerSteps = (peerId) => api(`/steps/user/${peerId}?date=${localDate()}`);
export const getMyActivity = () => api('/activity/me');
export const getPeerActivity = (peerId) => api(`/activity/peer/${peerId}`);

// ── Profile views ────────────────────────────────
export const recordProfileView = (ownerId) => api(`/profile-views/${ownerId}`, { method: 'POST' });
export const getProfileViewers = () =>
  api(`/profile-views?since=${encodeURIComponent(startOfLocalDayIso())}`);
export const deleteAccount = () => api('/auth/me', { method: 'DELETE' });
