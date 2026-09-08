import { Link } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { NiveshSetuLogo } from '../brand/NiveshSetuLogo';
import { navigation } from '../../data/navigation';
import { NavItem } from './NavItem';
export function Sidebar({ role, onNavigate }) { return <div className="sidebar"><Link className="sidebar-brand" to="/" onClick={onNavigate}><NiveshSetuLogo variant="light"/></Link><span className="sidebar-label">{role === 'officer' ? 'OFFICER WORKSPACE' : 'ENTREPRENEUR WORKSPACE'}</span><nav aria-label="Workspace navigation">{navigation[role].map(item => <NavItem key={item.title} item={item} role={role} onNavigate={onNavigate}/>)}</nav><div className="sidebar-bottom"><div className="sidebar-prototype"><ShieldCheck size={20}/><div><strong>Phase 1 demo</strong><small>Explore the foundation</small></div></div><Link to="/" className="nav-item" onClick={onNavigate}><LogOut size={19}/>Logout</Link></div></div>; }
