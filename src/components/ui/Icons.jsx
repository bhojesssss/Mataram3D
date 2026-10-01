/** Ikon garis situs ini. Semuanya mewarisi currentColor, jadi warnanya diatur parent. */

/** Roset moodboard: satu putik dengan empat kelopak. Lambang Mataram di situs ini. */
export function Rosette({ size = 22, strokeWidth = 1.4, className }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <circle cx="20" cy="20" r="3.4" />
        <ellipse cx="20" cy="10.5" rx="2.6" ry="6" />
        <ellipse cx="20" cy="29.5" rx="2.6" ry="6" />
        <ellipse cx="10.5" cy="20" rx="6" ry="2.6" />
        <ellipse cx="29.5" cy="20" rx="6" ry="2.6" />
      </g>
    </svg>
  );
}

export function ArrowRight({ size = 15, className }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}
