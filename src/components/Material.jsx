import { useId } from 'react';

/** Material 3 OutlinedTextField with a floating label. */
export function OutlinedField({ label, value, onChange, type = 'text', big, autoComplete, autoFocus }) {
  const id = useId();
  return (
    <div className={`m3-field ${big ? 'big' : ''}`}>
      <input id={id} type={type} value={value} placeholder=" " autoComplete={autoComplete} autoFocus={autoFocus}
        spellCheck={false} onChange={(e) => onChange(e.target.value)} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

/** Material 3 filled Button, 52 dp tall, with a spinner while loading. */
export function FilledButton({ children, disabled, busy, onClick, type = 'submit' }) {
  return (
    <button type={type} className="m3-filled" disabled={disabled} onClick={onClick}>
      {busy ? <span className="spinner small on-primary" aria-label="Loading" /> : children}
    </button>
  );
}

/** Material 3 AlertDialog */
export function AlertDialog({ title, text, confirmLabel, onConfirm, onDismiss, danger }) {
  return (
    <div className="scrim" onClick={onDismiss}>
      <div className="m3-dialog" role="alertdialog" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="m3-dialog-actions">
          <button className="text-btn" onClick={onDismiss}>Cancel</button>
          <button className={`text-btn ${danger ? 'error' : ''}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
