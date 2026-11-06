import type { MouseEventHandler, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const enum CardEmphasis {
  Raised = 'raised',
  Outlined = 'outlined',
}

const EMPHASIS_CLASSES: Record<CardEmphasis, string> = {
  [CardEmphasis.Raised]: 'shadow-xl border-none',
  [CardEmphasis.Outlined]: 'shadow-none border border-outline-variant',
};

interface CardProps {
  emphasis?: CardEmphasis;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  children: ReactNode;
}

const CardRoot = ({
  emphasis = CardEmphasis.Raised,
  className,
  onClick,
  children,
}: CardProps) => (
  <div
    className={cn(
      'bg-surface-container-lowest rounded-3xl p-6',
      EMPHASIS_CLASSES[emphasis],
      onClick && 'cursor-pointer',
      className,
    )}
    onClick={onClick}
  >
    {children}
  </div>
);

interface CardHeaderProps {
  children: ReactNode;
}

const CardHeader = ({ children }: CardHeaderProps) => (
  <div className="border-outline-variant mb-4 border-b pb-4">{children}</div>
);

const Card = Object.assign(CardRoot, { Header: CardHeader });

export default Card;
