import { isRouteErrorResponse, useRouteError } from 'react-router';
import Button from '@/components/common/Button.tsx';
import { ROUTE_DASHBOARD } from '@/constants/routings.ts';

const toMessage = (error: unknown): string => {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`;
  if (error instanceof Error) return error.message;
  return 'An unexpected routing error occurred.';
};

const RouteErrorPage = () => {
  const error = useRouteError();

  return (
    <div
      role="alert"
      className="bg-surface flex h-screen flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <span className="text-headline-md text-on-surface font-semibold">
        This page could not be loaded
      </span>
      <p className="text-body-md text-on-surface-variant max-w-prose break-words">
        {toMessage(error)}
      </p>
      <Button onClick={() => window.location.assign(ROUTE_DASHBOARD)}>Back to dashboard</Button>
    </div>
  );
};

export default RouteErrorPage;
