export default function Logo({ size = 32, withText = true }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="var(--brand)" />
        <circle cx="32" cy="32" r="18" fill="none" stroke="#fff" strokeWidth="4" opacity=".45" />
        <circle cx="32" cy="32" r="9" fill="#fff" />
      </svg>
      {withText && <span className="logo-text">consnow</span>}
    </span>
  );
}
