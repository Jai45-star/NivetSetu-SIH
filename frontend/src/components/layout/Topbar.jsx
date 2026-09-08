import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Bell, Menu, X } from 'lucide-react';
import { demoUsers } from '../../data/demoUsers';
import { Button } from '../ui/button';
import { Sidebar } from './Sidebar';
export function Topbar({ role }) {
 const user = demoUsers[role]; const [open, setOpen] = useState(false); const [notifications, setNotifications] = useState(false); const [items, setItems] = useState([]); const [notice, setNotice] = useState('');
 const toggleNotifications = async () => {
   setNotifications(!notifications);
   if (notifications) return;
   setNotice('Loading notifications…');
   try { const response = await fetch(`/api/${role === 'officer' ? 'officer' : 'applications'}/notifications`, { headers: { 'x-demo-role': role } }); const payload = await response.json(); if (!response.ok) throw new Error(payload.message); setItems(payload.data); setNotice(payload.data.length ? '' : 'No workflow notifications yet.'); } catch { setNotice('Could not load notifications. Close and reopen to retry.'); }
 };
 return <header className="topbar"><Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><Button variant="ghost" size="icon" className="mobile-menu" aria-label="Open navigation"><Menu/></Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="drawer-overlay"/><Dialog.Content className="drawer-content" aria-describedby={undefined}><Dialog.Title className="sr-only">Workspace navigation</Dialog.Title><Sidebar role={role} onNavigate={() => setOpen(false)}/><Dialog.Close asChild><button className="drawer-close" aria-label="Close navigation"><X size={20}/></button></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
 <span className="topbar-context">Industrial approval workspace</span><div className="topbar-right"><span className="demo-chip">Demo workspace</span><div className="notification-control"><Button variant="ghost" size="icon" aria-label="Notifications" aria-expanded={notifications} onClick={toggleNotifications}><Bell/>{items.length > 0 && <span className="notification-count">{items.length}</span>}</Button>{notifications && <div className="notification-popover"><strong>Notifications</strong><p>In-app prototype updates</p>{notice && <p role="status">{notice}</p>}{items.map(item => <Link className="notification-item" key={item.id} to={`/${role}/applications/${item.applicationId}`} onClick={() => setNotifications(false)}><strong>{item.type.replaceAll('_', ' ')}</strong><span>{item.unitName}</span><small>{new Date(item.at).toLocaleString('en-IN')}</small></Link>)}</div>}</div><span className="avatar">{user.initials}</span><div className="user-details"><strong>{user.name}</strong><span>{user.role}</span></div></div></header>;
}
