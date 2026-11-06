import type { ReactElement } from 'react';
import { Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  // CopilotChatView renders the welcome state *instead of* the message view, so
  // the chat input is handed to this slot. Dropping it leaves the welcome
  // screen with nothing to type into.
  input?: ReactElement;
}

const WelcomeScreen = ({ input }: WelcomeScreenProps) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 py-10 text-center">
    <span className="bg-primary text-on-primary mb-2 flex size-14 shrink-0 items-center justify-center rounded-2xl">
      <Sparkles className="size-7" />
    </span>
    <p className="text-headline-md text-on-surface">
      How can I help with your release notes?
    </p>
    <p className="text-body-md text-on-surface-variant max-w-[320px] leading-relaxed">
      Paste a git log or PR description here, then tell me which platform to
      draft release notes for.
    </p>
    <div className="mt-2 w-full max-w-[680px]">{input}</div>
  </div>
);

export default WelcomeScreen;
