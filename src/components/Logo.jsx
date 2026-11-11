/** The app logo (res/drawable/ic_consnow_logo.xml). */
export default function Logo({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="22 22 64 64" aria-hidden="true" className="logo-mark">
      <path d="M73.09,34.91 A27,27 0 1,0 73.09,73.09" stroke="var(--primary)" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M65.31,42.69 A16,16 0 1,0 65.31,65.31" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="54" cy="54" r="6.5" fill="var(--primary)" />
    </svg>
  );
}
