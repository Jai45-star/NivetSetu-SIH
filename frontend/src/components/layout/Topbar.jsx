import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Bell, Menu, X } from 'lucide-react';
import { demoUsers } from '../../data/demoUsers';
import { Button } from '../ui/button';
import { Sidebar } from './Sidebar';
export function Topbar({ role }) { const user = demoUsers[role]; const [open, setOpen] = useState(false); const [notifications, setNotifications] = useState(false);
 return <header className="topbar"><Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><Button variant="ghost" size="icon" className="mobile-menu" aria-label="Open navigation"><Menu/></Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="drawer-overlay"/><Dialog.Content className="drawer-content" aria-describedby={undefined}><Dialog.Title className="sr-only">Workspace navigation</Dialog.Title><Sidebar role={role} onNavigate={() => setOpen(false)}/><Dialog.Close asChild><button className="drawer-close" aria-label="Close navigation"><X size={20}/></button></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
 <span className="topbar-context">Industrial approval workspace</span><div className="topbar-right"><span className="demo-chip">Demo workspace</span><div className="notification-control"><Button variant="ghost" size="icon" aria-label="Notifications" aria-expanded={notifications} onClick={() => setNotifications(!notifications)}><Bell/></Button>{notifications && <div className="notification-popover"><strong>Notifications</strong><p>No live notifications in this demo.</p>{role === 'entrepreneur' && <Link to="/entrepreneur/notifications" onClick={() => setNotifications(false)}>Open notifications</Link>}</div>}</div><span className="avatar">{user.initials}</span><div className="user-details"><strong>{user.name}</strong><span>{user.role}</span></div></div></header>;
}
