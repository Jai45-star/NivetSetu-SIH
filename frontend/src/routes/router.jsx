import { createBrowserRouter } from 'react-router-dom';
import { Landing } from '../pages/Landing/Landing';
import { AppShell } from '../components/layout/AppShell';
import { EntrepreneurDashboard } from '../pages/entrepreneur/Dashboard';
import { OfficerDashboard } from '../pages/officer/Dashboard';
import { Placeholder } from '../pages/Placeholder';
import { NotFound } from '../pages/NotFound';
import { navigation } from '../data/navigation';
// Role URLs are intentionally public in Phase 1. This is not an auth boundary.
export const router = createBrowserRouter([{ path: '/', element: <Landing/> }, ...['entrepreneur', 'officer'].map(role => ({ path: `/${role}`, element: <AppShell role={role}/>, children: [{ index: true, element: role === 'entrepreneur' ? <EntrepreneurDashboard/> : <OfficerDashboard/> }, ...navigation[role].filter(item => item.path).map(item => ({ path: item.path, element: <Placeholder title={item.title} role={role}/> })), { path: '*', element: <NotFound role={role}/> }] })), { path: '*', element: <NotFound/> }]);
