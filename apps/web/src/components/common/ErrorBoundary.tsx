import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button, { ButtonVariant } from '@/components/common/Button.tsx';

export const enum ErrorBoundaryVariant {
  Page = 'page',
  Panel = 'panel',
  Inline = 'inline',
}

interface ErrorBoundaryProps {
  children: ReactNode;
  title: string;
  variant?: ErrorBoundaryVariant;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const CONTAINER_CLASSES: Record<ErrorBoundaryVariant, string> = {
  [ErrorBoundaryVariant.Page]:
    'bg-surface flex h-screen flex-col items-center justify-center gap-4 px-6 text-center',
  [ErrorBoundaryVariant.Panel]:
    'border-error/30 bg-error/5 flex flex-col items-start gap-3 rounded-3xl border p-6',
  [ErrorBoundaryVariant.Inline]:
    'text-error flex items-center gap-2 text-label-sm',
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ErrorBoundary] ${this.props.title}`, error, info.componentStack);
  }

  private readonly reset = (): void => this.setState({ error: null });

  render(): ReactNode {
    const { error } = this.state;
    const { children, title, variant = ErrorBoundaryVariant.Panel } = this.props;

    if (!error) return children;

    if (variant === ErrorBoundaryVariant.Inline) {
      return (
        <span role="alert" className={CONTAINER_CLASSES[variant]}>
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          {title}
          <button
            type="button"
            onClick={this.reset}
            className="text-primary cursor-pointer underline"
          >
            Retry
          </button>
        </span>
      );
    }

    const isPage = variant === ErrorBoundaryVariant.Page;

    return (
      <div role="alert" className={CONTAINER_CLASSES[variant]}>
        <span className="text-error flex items-center gap-2">
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          <span className="text-headline-md font-semibold">{title}</span>
        </span>
        <p className="text-body-md text-on-surface-variant max-w-prose break-words">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <Button
          variant={isPage ? ButtonVariant.Primary : ButtonVariant.Ghost}
          onClick={isPage ? () => window.location.reload() : this.reset}
        >
          {isPage ? 'Reload the app' : 'Try again'}
        </Button>
      </div>
    );
  }
}

export default ErrorBoundary;
