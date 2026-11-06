import { cn } from '@/lib/cn';

export const enum AvatarSize {
  Sm = 'sm',
  Md = 'md',
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  [AvatarSize.Sm]: 'size-6 text-[10.5px]',
  [AvatarSize.Md]: 'size-8 text-label-xs',
};

interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

const Avatar = ({ name, src, size = AvatarSize.Md, className }: AvatarProps) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', SIZE_CLASSES[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'bg-primary-soft-strong text-on-primary-soft inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
};

export default Avatar;
