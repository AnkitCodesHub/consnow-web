import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';
import { OutlinedField, FilledButton } from './Material';

const OFFLINE = "You're offline. Connect to the internet and try again.";

/** AuthScreen.kt */
export default function AuthPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true); setError(null);
    try {
      if (isRegister) await register(name, email, password);
      else await login(email, password);
    } catch (err) {
      setError(err.status === 0 ? OFFLINE : err.status === 401 ? 'Invalid email or password' : err.message);
    } finally { setBusy(false); }
  };

  const canSubmit = !busy && email.trim() && password.trim() && (!isRegister || name.trim());

  return (
    <div className="auth-screen">
      <form className="auth-col" onSubmit={submit}>
        <Logo size={72} />
        <h1 className="headline primary">Consnow</h1>
        <p className="body-l muted">{isRegister ? 'Create your account' : 'Welcome back'}</p>
        <div className="gap40" />
        <div className={`collapse ${isRegister ? 'open' : ''}`}>
          <div><OutlinedField label="Name" value={name} onChange={setName} autoComplete="name" /></div>
        </div>
        <OutlinedField label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <OutlinedField label="Password" type="password" value={password} onChange={setPassword}
          autoComplete={isRegister ? 'new-password' : 'current-password'} />
        {error && <p className={`field-msg ${error === OFFLINE ? 'muted' : 'error'}`}>{error}</p>}
        <div className="gap12" />
        <FilledButton disabled={!canSubmit} busy={busy}>{isRegister ? 'Create account' : 'Sign in'}</FilledButton>
        <div className="gap16" />
        <button type="button" className="text-btn" onClick={() => { setIsRegister(!isRegister); setError(null); }}>
          {isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      </form>
    </div>
  );
}
