import { cn } from '@/lib/cn';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  'aria-label': string;
}

const Checkbox = ({ checked, onChange, ...rest }: CheckboxProps) => (
  <label className="inline-flex cursor-pointer items-center">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="sr-only"
      {...rest}
    />
    <span
      className={cn(
        'border-outline-variant flex h-5 w-5 items-center justify-center rounded-md border',
        checked && 'bg-primary border-primary',
      )}
    >
      {checked && (
        <svg
          viewBox="0 0 16 16"
          className="stroke-on-primary h-3 w-3 fill-none stroke-2"
        >
          <path d="M3 8l3 3 7-7" />
        </svg>
      )}
    </span>
  </label>
);

export default Checkbox;
