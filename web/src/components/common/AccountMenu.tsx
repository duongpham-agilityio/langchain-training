import { useState } from 'react';
// TODO(coming-soon): restore KeyRound / Settings / useComingSoon with the Settings
// and Keyboard shortcuts items below.
// import { KeyRound, LogOut, MoreHorizontal, Settings } from 'lucide-react';
// import { useComingSoon } from '@/hooks/use-coming-soon.ts';
import { LogOut, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.ts';
import { ToastKind } from '@/store/toast-store.ts';
import Avatar, { AvatarSize } from './Avatar.tsx';
import ConfirmDialog from './ConfirmDialog.tsx';
import DropdownMenu from './DropdownMenu.tsx';
import IconButton, { IconButtonSize } from './IconButton.tsx';

interface AccountMenuProps {
  userName: string;
  avatarSrc?: string;
  onSignOut: () => Promise<void>;
}

const AccountMenu = ({ userName, avatarSrc, onSignOut }: AccountMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  // const { showComingSoon } = useComingSoon();
  const { showToast } = useToast();
  // const showComingSoonFor = (feature: string) => () => {
  //   setIsOpen(false);
  //   showComingSoon(feature);
  // };
  const handleSignOutRequest = () => {
    setIsOpen(false);
    setIsSignOutConfirmOpen(true);
  };
  const handleSignOutConfirm = async () => {
    setIsSigningOut(true);
    try {
      await onSignOut();
      // Stays blocking: the store's session update lands async after this
      // resolves, and AppBootstrap redirects once it does — this component
      // unmounts then, so there's no "success" state to fall back to here.
    } catch (error) {
      setIsSigningOut(false);
      showToast({
        kind: ToastKind.Error,
        title: 'Couldn’t sign out',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <div className="mt-1 flex h-8.5 items-center gap-2.5 rounded-lg pr-1 pl-2.5">
      <Avatar name={userName} src={avatarSrc} size={AvatarSize.Sm} />
      <span className="text-on-surface text-body-sm min-w-0 flex-1 truncate font-semibold">
        {userName}
      </span>
      {/* Anchored to the trigger, not the row: `bottom-full` opens upward (the row
          sits at the very bottom of the sidebar) and `align="end"` keeps the menu's
          right edge on the button. */}
      <div className="relative shrink-0">
        <IconButton
          icon={<MoreHorizontal className="size-4" />}
          size={IconButtonSize.Sm}
          isActive={isOpen}
          aria-label="Account menu"
          onClick={() => setIsOpen((open) => !open)}
        />
        <DropdownMenu
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          align="end"
          className="bottom-full mb-1.5"
        >
          {/* TODO(coming-soon): Settings / Keyboard shortcuts — to be implemented later.
          <DropdownMenu.Item
            icon={<Settings className="size-4" />}
            onClick={showComingSoonFor('Settings')}
          >
            Settings
          </DropdownMenu.Item>
          <DropdownMenu.Item
            icon={<KeyRound className="size-4" />}
            hint="?"
            onClick={showComingSoonFor('Keyboard shortcuts')}
          >
            Keyboard shortcuts
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          */}
          <DropdownMenu.Item
            icon={<LogOut className="size-4" />}
            onClick={handleSignOutRequest}
            danger
          >
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu>
      </div>
      <ConfirmDialog
        isOpen={isSignOutConfirmOpen}
        icon={<LogOut className="size-5" />}
        title="Sign out?"
        description="You’ll need to sign in again to access your workspace."
        confirmLabel="Sign out"
        confirmingLabel="Signing out…"
        isConfirming={isSigningOut}
        onConfirm={handleSignOutConfirm}
        onCancel={() => setIsSignOutConfirmOpen(false)}
      />
    </div>
  );
};

export default AccountMenu;
