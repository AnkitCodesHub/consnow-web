import { useState } from 'react';
import * as Api from '../api/consnow';

export default function AddFriend({ onDone, toast }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length !== 6) return toast('Codes are 6 characters long.', 'error');
    setBusy(true);
    try {
      const r = await Api.connectByCode(c);
      if (r?.state === 'request_sent') toast(`Request sent to ${r?.peer?.name ?? 'your friend'}`);
      else toast(`Connected${r?.peer?.name ? ` with ${r.peer.name}` : ''}!`);
      setCode('');
      onDone();
    } catch (e2) {
      toast(e2.status === 404 ? 'No one has that code.' : e2.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="add-friend" onSubmit={submit}>
      <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        maxLength={6} placeholder="Friend’s code" aria-label="Friend's connection code" spellCheck={false} />
      <button className="btn primary" disabled={busy || code.length !== 6}>{busy ? '…' : 'Connect'}</button>
    </form>
  );
}
