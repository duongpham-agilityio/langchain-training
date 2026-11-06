import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface BrandMarkProps {
  className?: string;
}

// The design's `.mark`: a primary tile with an inset top highlight. One
// definition so the logo can't drift between the sidebar's expanded and
// collapsed states.
const BrandMark = ({ className }: BrandMarkProps) => (
  <span
    className={cn(
      'bg-primary flex size-7 shrink-0 items-center justify-center rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]',
      className,
    )}
  >
    <ArrowRight className="size-3.75 text-white" strokeWidth={2.4} />
  </span>
);

export default BrandMark;
