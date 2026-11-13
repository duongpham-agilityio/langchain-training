// Renders the real ThreadListItem for the three row shapes the sidebar can see.
// Copy to apps/web/repro.tmp.tsx, run from apps/web:
//   ../ai/node_modules/.bin/tsx --tsconfig tsconfig.app.json repro.tmp.tsx
// then delete the copy.
import { renderToStaticMarkup } from 'react-dom/server';
import ThreadListItem from '@/components/chat/ThreadListItem.tsx';

const ID = '3f2b8c1e-5d4a-4e7b-9a60-1c2d3e4f5a6b';
const base = { resourceId: 'u1', createdAt: 'x', updatedAt: 'x' };
const cases: Array<[string, string]> = [
  ['client placeholder (use-draft-thread-row writes title = id)', ID],
  ['server row, title not generated yet (title = "")', ''],
  ['server row, generated title', 'Release notes for v1.2'],
];

let bug = false;
for (const [label, title] of cases) {
  const html = renderToStaticMarkup(
    <ul>
      <ThreadListItem
        thread={{ ...base, id: ID, title }}
        isActive={false}
        onSelect={() => {}}
      />
    </ul>,
  );
  const text = html.match(/<button[^>]*>(.*?)<\/button>/)?.[1] ?? '?';
  console.log(`${label}\n  sidebar shows: "${text}"`);
  if (text === ID) bug = true;
}
console.log(bug ? 'RESULT: BUG - raw thread UUID shown as title' : 'RESULT: OK');
