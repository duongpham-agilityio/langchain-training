import { useState, type FormEvent } from 'react';
import Button, {
  ButtonSize,
  ButtonVariant,
} from '@/components/common/Button.tsx';
import { CHANGE_TYPES, type ChangeType } from '@training/contracts';
import { CHANGE_TYPE_LABELS } from '@/constants/changelog.ts';
import Input from '@/components/common/Input.tsx';
import {
  EMPTY_CHANGELOG_FILTERS,
  type ChangelogFilters as Filters,
} from '@/hooks/use-changelog.ts';

interface ChangelogFiltersProps {
  filters: Filters;
  onApply: (filters: Filters) => void;
}

const INPUT_CLASSES = 'h-9 rounded-[9px] py-0 text-[13.5px]';

// Edits are held locally and applied on submit: the version filter is an exact
// match, so querying on every keystroke would only fire requests for
// half-typed versions.
const ChangelogFilters = ({ filters, onApply }: ChangelogFiltersProps) => {
  const [draft, setDraft] = useState<Filters>(filters);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onApply(draft);
  };

  const handleClear = () => {
    setDraft(EMPTY_CHANGELOG_FILTERS);
    onApply(EMPTY_CHANGELOG_FILTERS);
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Changelog filters"
      className="flex flex-wrap items-end gap-3"
    >
      <label className="text-label-xs text-on-surface-muted flex flex-col gap-1 font-semibold">
        Version
        <Input
          type="text"
          value={draft.version}
          onChange={(event) =>
            setDraft({ ...draft, version: event.target.value })
          }
          placeholder="e.g. 2.4.0"
          className={INPUT_CLASSES}
        />
      </label>
      <label className="text-label-xs text-on-surface-muted flex flex-col gap-1 font-semibold">
        Change type
        <select
          value={draft.changeType}
          onChange={(event) =>
            setDraft({
              ...draft,
              changeType: event.target.value as ChangeType | '',
            })
          }
          className={`${INPUT_CLASSES} border-outline-variant bg-surface-container-lowest text-on-surface rounded-[9px] border px-3`}
        >
          <option value="">All types</option>
          {CHANGE_TYPES.map((type) => (
            <option key={type} value={type}>
              {CHANGE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-label-xs text-on-surface-muted flex flex-col gap-1 font-semibold">
        From
        <Input
          type="date"
          value={draft.from}
          max={draft.to || undefined}
          onChange={(event) => setDraft({ ...draft, from: event.target.value })}
          className={INPUT_CLASSES}
        />
      </label>
      <label className="text-label-xs text-on-surface-muted flex flex-col gap-1 font-semibold">
        To
        <Input
          type="date"
          value={draft.to}
          min={draft.from || undefined}
          onChange={(event) => setDraft({ ...draft, to: event.target.value })}
          className={INPUT_CLASSES}
        />
      </label>
      <Button type="submit" size={ButtonSize.Sm}>
        Apply
      </Button>
      <Button
        type="button"
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Sm}
        onClick={handleClear}
      >
        Clear
      </Button>
    </form>
  );
};

export default ChangelogFilters;
