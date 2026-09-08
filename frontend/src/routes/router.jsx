import { createBrowserRouter } from 'react-router-dom';
import { Landing } from '../pages/Landing/Landing';
import { AppShell } from '../components/layout/AppShell';
import { EntrepreneurDashboard } from '../pages/entrepreneur/Dashboard';
import { EntrepreneurApplications } from '../pages/entrepreneur/Applications';
import { ApplicationWizard } from '../pages/entrepreneur/ApplicationWizard';
import { OfficerWorkspace, ApplicationReview } from '../pages/officer/Workspace';
import { Placeholder } from '../pages/Placeholder';
import { NotFound } from '../pages/NotFound';
import { navigation } from '../data/navigation';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/entrepreneur',
    element: <AppShell role="entrepreneur" />,
    children: [
      {
        index: true,
        element: <EntrepreneurDashboard />,
      },
      {
        path: 'applications',
        element: <EntrepreneurApplications />,
      },
      {
        path: 'applications/new',
        element: <ApplicationWizard />,
      },
      {
        path: 'applications/:id',
        element: <ApplicationWizard />,
      },
      // Placeholders for remaining entrepreneur subroutes (documents, notifications, assistant, help)
      ...navigation.entrepreneur
        .filter(item => item.path && !item.path.startsWith('applications'))
        .map(item => ({
          path: item.path,
          element: <Placeholder title={item.title} role="entrepreneur" />,
        })),
      {
        path: '*',
        element: <NotFound role="entrepreneur" />,
      },
    ],
  },
  {
    path: '/officer',
    element: <AppShell role="officer" />,
    children: [
      {
        index: true,
        element: <OfficerWorkspace />,
      },
      { path: 'applications', element: <OfficerWorkspace mode="applications" /> },
      { path: 'applications/:id', element: <ApplicationReview /> },
      { path: 'review', element: <OfficerWorkspace mode="review" /> },
      { path: 'sla', element: <OfficerWorkspace mode="sla" /> },
      { path: 'reports', element: <OfficerWorkspace mode="reports" /> },
      ...navigation.officer
        .filter(item => item.path && !['applications', 'review', 'sla', 'reports'].includes(item.path))
        .map(item => ({
          path: item.path,
          element: <Placeholder title={item.title} role="officer" />,
        })),
      {
        path: '*',
        element: <NotFound role="officer" />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
