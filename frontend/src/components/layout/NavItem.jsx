import { Link, useLocation } from 'react-router-dom';
export function NavItem({ item, role, onNavigate }) {
  const Icon = item.icon;
  const { pathname } = useLocation();
  const to = `/${role}${item.path ? `/${item.path}` : ''}`;
  const clean = pathname.replace(/\/+$/, '');
  const active = clean === to || (item.path === 'applications' && clean.startsWith(to + '/') && clean !== to + '/new');
  return <Link to={to} aria-current={active ? 'page' : undefined} onClick={onNavigate} className={`nav-item${active ? ' active' : ''}`}><Icon size={19}/><span>{item.title}</span></Link>;
}

