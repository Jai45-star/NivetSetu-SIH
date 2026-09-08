import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
export function RoleCard({ role, description, icon: Icon, to }) { return <Link className="role-card" to={to}><span className="role-icon"><Icon size={24}/></span><span><strong>{role}</strong><small>{description}</small></span><ArrowRight className="role-arrow" size={19}/></Link>; }
