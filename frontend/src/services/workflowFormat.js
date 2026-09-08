export const date = value => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not started';
export const days = n => Number.isFinite(n) ? `${Math.max(0, n).toFixed(1)} days` : '—';
