export function StatusBadge({ children, tone = 'primary' }) { return <span className={`status-badge tone-${tone}`}>{children}</span>; }
