interface MonoTagProps {
  children: string;
}

const MonoTag = ({ children }: MonoTagProps) => (
  <span className="text-label-sm bg-surface-container text-on-surface-variant rounded-md px-2 py-0.5 font-mono">
    {children}
  </span>
);

export default MonoTag;
