import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
export function AppShell({ role }) { const { pathname } = useLocation(); useEffect(() => { window.scrollTo(0, 0); document.getElementById('page-title')?.focus({ preventScroll: true }); }, [pathname]); return <div className="app-shell"><a className="skip-link" href="#workspace-main">Skip to content</a><aside className="desktop-sidebar"><Sidebar role={role}/></aside><div className="workspace"><Topbar role={role}/><main id="workspace-main" className="workspace-content"><Outlet/></main><footer className="workspace-footer"><span>NiveshSetu · First-Time-Right Industrial Approvals</span><span>Sample data · Phase 1 prototype</span></footer></div></div>; }
