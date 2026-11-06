import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, GitCommit, Send, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth.ts';
import { getSignInErrorMessage } from '@/utils/supabase-sign-in-error-message.ts';
import Button, { ButtonVariant } from '@/components/common/Button.tsx';
import Input from '@/components/common/Input.tsx';
import PasswordInput from '@/components/common/PasswordInput.tsx';
import FormField from '@/components/common/FormField.tsx';
import InlineBanner, { BannerVariant } from '@/components/common/InlineBanner.tsx';
import GithubMark from '@/icons/GithubMark.tsx';

interface BrandFeature {
  icon: ReactNode;
  label: string;
}

const BRAND_FEATURES: BrandFeature[] = [
  {
    icon: <GitCommit className="size-4.5" />,
    label: 'Reads every commit since your last release',
  },
  {
    icon: <Sparkles className="size-4.5" />,
    label: 'Drafts and edits notes with AI',
  },
  {
    icon: <Send className="size-4.5" />,
    label: 'Publishes straight to Slack, the App Store, and GitHub',
  },
];

const BrandPanel = () => (
  <div className="bg-primary-ink relative hidden w-[55.56%] shrink-0 flex-col overflow-hidden px-16 py-14 lg:flex">
    <div className="bg-primary-container/40 pointer-events-none absolute -top-45 -left-35 size-140 rounded-full blur-3xl" />
    <div className="bg-primary/45 pointer-events-none absolute -right-40 -bottom-55 size-155 rounded-full blur-3xl" />

    <div className="relative flex items-center gap-3">
      <span className="text-body-lg font-bold tracking-tight text-white">
        Release Builder
      </span>
    </div>

    <div className="relative flex flex-1 flex-col justify-center gap-9">
      <h1 className="text-display text-white">
        Ship release notes your team will actually read.
      </h1>
      <p className="text-body-lg max-w-130 leading-relaxed text-white/70">
        Release Builder turns your commit history into clear, on-brand notes for
        Slack, the App Store, and GitHub — in minutes, not hours.
      </p>
      <div className="mt-2 flex flex-col gap-5">
        {BRAND_FEATURES.map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              {icon}
            </span>
            <span className="text-body-md font-medium text-white/90">{label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SignInPage = () => {
  const { signInWithOAuth, signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: (variables: { email: string; password: string }) =>
      signInWithPassword(variables.email, variables.password),
  });

  const isSubmitting = mutation.isPending || mutation.isSuccess;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ email, password });
  };

  return (
    <div className="bg-surface-container-lowest flex min-h-screen">
      <BrandPanel />

      <div className="flex flex-1 flex-col px-8 py-10 sm:px-16">
        <div className="flex items-center gap-2.5">
          <span className="text-body-md text-on-surface-variant font-semibold">
            Release Builder
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-95 flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <h2 className="text-headline-lg text-on-surface">Sign in with email</h2>
              <p className="text-body-md text-on-surface-variant">
                Enter your work email and password to continue.
              </p>
            </div>

            {mutation.isError && (
              <InlineBanner
                variant={BannerVariant.Error}
                icon={<AlertCircle className="size-4" />}
              >
                {getSignInErrorMessage(mutation.error)}
              </InlineBanner>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <FormField id="sign-in-email" label="Email">
                <Input
                  id="sign-in-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  disabled={isSubmitting}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </FormField>

              <FormField id="sign-in-password" label="Password">
                <PasswordInput
                  id="sign-in-password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  disabled={isSubmitting}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </FormField>

              <Button type="submit" disabled={!email || !password || isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div className="text-on-surface-variant flex items-center gap-3 text-[12.5px] font-medium">
              <span className="bg-outline-variant h-px flex-1" />
              or
              <span className="bg-outline-variant h-px flex-1" />
            </div>

            <Button
              variant={ButtonVariant.Secondary}
              className="bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-container border"
              disabled={isSubmitting}
              onClick={() => void signInWithOAuth('github')}
            >
              <span className="flex items-center justify-center gap-2.5">
                <GithubMark />
                Continue with GitHub
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
