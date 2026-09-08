import { EmptyState } from '../components/shared/EmptyState';
export function NotFound({ role }) { return <div className="not-found"><EmptyState title="Page not found" description="This address doesn't match a page in NiveshSetu. Use the link below to find your way back." to={role ? `/${role}` : '/'} action={role ? 'Back to dashboard' : 'Back to home'}/></div>; }
