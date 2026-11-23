import { useEffect, useState, type SubmitEventHandler } from 'react';
import { FolderPlus, Loader2 } from 'lucide-react';
import { PROJECT_NAME_MAX_LENGTH } from '@training/contracts';
import Button, { ButtonSize, ButtonVariant } from '@/components/common/Button.tsx';
import FormField from '@/components/common/FormField.tsx';
import Input from '@/components/common/Input.tsx';
import { useActiveProject } from '@/hooks/use-active-project.ts';
import { useProjects } from '@/hooks/use-projects.ts';

interface CreateProjectDialogProps {
  // Required = the user has no project yet: no Cancel, no Escape, no backdrop close.
  isRequired?: boolean;
  onClose?: () => void;
}

const CreateProjectDialog = ({ isRequired = false, onClose }: CreateProjectDialogProps) => {
  const [name, setName] = useState('');
  const { create, isCreating, createError } = useProjects();
  const { setActiveProjectId } = useActiveProject();
  const trimmedName = name.trim();

  useEffect(() => {
    if (isRequired || !onClose) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isCreating) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRequired, isCreating, onClose]);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!trimmedName || isCreating) return;

    try {
      const project = await create(trimmedName);
      setActiveProjectId(project.id);
      onClose?.();
    } catch {
      // Shown from `createError`.
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={isRequired || isCreating ? undefined : onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="bg-surface-container-lowest w-[420px] rounded-2xl p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="bg-primary-soft text-primary flex size-10 items-center justify-center rounded-xl">
          <FolderPlus className="size-5" />
        </div>
        <h2 id="create-project-title" className="text-headline-md text-on-surface mt-4 font-semibold">
          {isRequired ? 'Create your first project' : 'New project'}
        </h2>
        <p className="text-body-md text-on-surface-variant mt-1.5">
          {isRequired
            ? 'Chats and release notes live inside a project. Create one to get started.'
            : 'Chats and release notes are grouped by project.'}
        </p>
        <FormField
          id="project-name"
          label="Project name"
          className="mt-4"
          error={createError?.message}
        >
          <Input
            id="project-name"
            autoFocus
            value={name}
            maxLength={PROJECT_NAME_MAX_LENGTH}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Mobile app"
            disabled={isCreating}
          />
        </FormField>
        <div className="mt-6 flex justify-end gap-2">
          {!isRequired && (
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Sm}
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size={ButtonSize.Sm}
            disabled={!trimmedName || isCreating}
          >
            {isCreating && <Loader2 className="size-3.5 animate-spin" />}
            Create project
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectDialog;
