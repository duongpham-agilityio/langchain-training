import BrandMark from './BrandMark.tsx';

interface WorkspaceSwitchProps {
  name: string;
  onClick?: () => void;
}

const WorkspaceSwitch = ({ name, onClick }: WorkspaceSwitchProps) => (
  <button
    type="button"
    onClick={onClick}
    className="hover:bg-surface-container -ml-1.5 flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-[10px] p-1.5 text-left"
  >
    <BrandMark />
    <span className="text-body-sm text-on-surface min-w-0 flex-1 truncate font-semibold tracking-[-0.01em]">
      {name}
    </span>
  </button>
);

export default WorkspaceSwitch;
