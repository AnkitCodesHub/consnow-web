import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { session, setUnauthorizedHandler } from '../api/client';
import * as Api from '../api/consnow';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(session.token);
  const [user, setUser] = useState(session.user);

  const logout = useCallback(() => {
    session.clear();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  // Sliding session: swap a still-valid token for a fresh one on load.
  useEffect(() => {
    if (!token) return;
    Api.refreshToken()
      .then((r) => {
        if (r?.token) { session.save(r.token); setToken(r.token); }
      })
      .catch(() => { /* 401 already handled; offline is fine */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = (r) => {
    session.save(r.token, r.user);
    setToken(r.token);
    setUser(r.user);
  };

  const login = async (email, password) => finish(await Api.login(email.trim(), password));
  const register = async (name, email, password) =>
    finish(await Api.register(name.trim(), email.trim(), password));

  return (
    <AuthCtx.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
