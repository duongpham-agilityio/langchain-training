import { createBrowserRouter } from 'react-router';
import App from '../App.tsx';
import { ROUTE_DASHBOARD, ROUTE_HISTORY, ROUTE_SIGN_IN } from '@/constants/routings.ts';
import AppBootstrap from './AppBootstrap.tsx';
import DashboardPage from './DashboardPage.tsx';
import HistoryPage from './HistoryPage.tsx';
import RouteErrorPage from './RouteErrorPage.tsx';
import SignInPage from './SignInPage.tsx';

export const router = createBrowserRouter([
  {
    Component: AppBootstrap,
    ErrorBoundary: RouteErrorPage,
    children: [
      { path: ROUTE_SIGN_IN, Component: SignInPage },
      {
        path: ROUTE_DASHBOARD,
        Component: App,
        children: [
          { index: true, Component: DashboardPage },
          { path: ROUTE_HISTORY, Component: HistoryPage },
        ],
      },
    ],
  },
]);
