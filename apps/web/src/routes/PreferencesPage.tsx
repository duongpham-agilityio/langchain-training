import { useState, type FormEvent } from 'react';
import type { UserPreferencesRecord } from '@training/contracts';
import { USER_PREFERENCE_MAX_LENGTH } from '@training/contracts';
import Button, {
  ButtonSize,
  ButtonVariant,
} from '@/components/common/Button.tsx';
import FormField from '@/components/common/FormField.tsx';
import Input from '@/components/common/Input.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import { useUserPreferences } from '@/hooks/use-user-preferences.ts';
import { ToastKind } from '@/store/toast-store.ts';

interface PreferencesFormProps {
  initial: UserPreferencesRecord;
}

// Keyed on the saved record by the page, so the form starts from what is stored.
const PreferencesForm = ({ initial }: PreferencesFormProps) => {
  const { save, isSaving } = useUserPreferences();
  const { showToast } = useToast();
  const [tone, setTone] = useState(initial.tone ?? '');
  const [writingStyle, setWritingStyle] = useState(initial.writingStyle ?? '');
  const [openingLine, setOpeningLine] = useState(initial.openingLine ?? '');

  const submit = async (values: UserPreferencesRecord, title: string) => {
    try {
      await save(values);
      showToast({ kind: ToastKind.Success, title });
    } catch (error) {
      showToast({
        kind: ToastKind.Error,
        title: 'Couldn’t save your template',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit({ tone, writingStyle, openingLine }, 'Template saved');
  };

  const handleClear = () => {
    setTone('');
    setWritingStyle('');
    setOpeningLine('');
    void submit({}, 'Template cleared');
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <FormField id="pref-tone" label="Tone">
        <Input
          id="pref-tone"
          value={tone}
          maxLength={USER_PREFERENCE_MAX_LENGTH}
          onChange={(event) => setTone(event.target.value)}
          placeholder="e.g. friendly, formal"
        />
      </FormField>
      <FormField id="pref-style" label="Writing style">
        <Input
          id="pref-style"
          value={writingStyle}
          maxLength={USER_PREFERENCE_MAX_LENGTH}
          onChange={(event) => setWritingStyle(event.target.value)}
          placeholder="e.g. short bullet points, no jargon"
        />
      </FormField>
      <FormField id="pref-opening" label="Opening line">
        <Input
          id="pref-opening"
          value={openingLine}
          maxLength={USER_PREFERENCE_MAX_LENGTH}
          onChange={(event) => setOpeningLine(event.target.value)}
          placeholder="e.g. Dear valued customers,"
        />
      </FormField>
      <div className="flex gap-2">
        <Button type="submit" size={ButtonSize.Sm} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
        <Button
          type="button"
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Sm}
          onClick={handleClear}
          disabled={isSaving}
        >
          Clear
        </Button>
      </div>
    </form>
  );
};

const PreferencesPage = () => {
  const { preferences, isLoading, isError, refetch } = useUserPreferences();

  const renderContent = () => {
    if (isLoading) {
      return (
        <span
          role="status"
          aria-label="Loading template"
          className="bg-surface-container h-40 max-w-xl animate-pulse rounded-[10px]"
        />
      );
    }
    if (isError || !preferences) {
      return (
        <div className="flex flex-col items-start gap-2">
          <span className="text-body-md text-on-surface-variant">
            Couldn’t load your template.
          </span>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            onClick={refetch}
          >
            Retry
          </Button>
        </div>
      );
    }
    return (
      <PreferencesForm
        key={JSON.stringify(preferences)}
        initial={preferences}
      />
    );
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="border-outline-subtle flex h-14 shrink-0 items-center border-b pr-4 pl-6">
        <h1 className="text-body-md text-on-surface min-w-0 truncate font-semibold">
          My template
        </h1>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-8 pt-5 pb-6">
        <p className="text-body-md text-on-surface-variant max-w-xl">
          Your tone, writing style and opening line are applied to every release
          notes draft. Leave a field empty to not use it.
        </p>
        {renderContent()}
      </div>
    </div>
  );
};

export default PreferencesPage;
