export function NiveshSetuLogo({ iconOnly = false, variant = 'dark', className = '' }) {
  return <span className={`brand brand-${variant} ${className}`}>
    <svg width="38" height="40" viewBox="0 0 40 42" fill="none" role="img" aria-label={iconOnly ? 'NiveshSetu' : undefined} aria-hidden={!iconOnly}>
      <path d="M6 33V15M18 35V7M30 28V3" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
      <path d="M3 25L12 18L25 29L37 14" stroke="var(--success)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30 14H37V21" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {!iconOnly && <span><strong>Nivesh<span>Setu</span></strong><small>First-Time-Right Industrial Approvals</small></span>}
  </span>;
}
