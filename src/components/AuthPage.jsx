import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (mode === 'register' && password.length < 8) return setErr('Password must be at least 8 characters.');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
    } catch (e2) {
      setErr(e2.status === 401 ? 'Wrong email or password.' : e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-side">
        <Logo size={44} />
        <h1>See how your people are doing — right now.</h1>
        <p>Steps, last active, and phone lock status of the friends who chose to share with you. Same account as the Consnow app.</p>
        <ul className="auth-points">
          <li><span className="dot ok" /> Consent first — you only see friends you’re connected with</li>
          <li><span className="dot live" /> Live updates when a friend unlocks or starts walking</li>
          <li><span className="dot" /> Disconnect anytime, instantly</li>
        </ul>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <div className="tabs">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setErr(''); }}>Log in</button>
          <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setErr(''); }}>Create account</button>
        </div>

        {mode === 'register' && (
          <label>Name
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoComplete="name" placeholder="Your name" />
          </label>
        )}
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'} />
        </label>

        {err && <div className="form-err" role="alert">{err}</div>}

        <button className="btn primary block" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
        <p className="muted small center">Use the same email & password as your Consnow phone app.</p>
      </form>
    </div>
  );
}
