interface RawMarkdownViewProps {
  markdown: string | null;
}

const RawMarkdownView = ({ markdown }: RawMarkdownViewProps) => {
  if (!markdown) {
    return (
      <p className="text-body-md text-on-surface-variant px-8 py-7">
        No content yet — paste a git log or PR text in the chat and ask Release Builder
        to draft release notes.
      </p>
    );
  }

  return (
    <div className="bg-surface-container-low min-h-full py-5 font-mono text-[12.5px] leading-[1.9]">
      {markdown.split('\n').map((line, index) => (
        <div key={index} className="flex">
          <span className="w-11 shrink-0 pr-4 text-right text-[#a19cb0] select-none">
            {index + 1}
          </span>
          <span className="text-on-surface min-w-0 flex-1 pr-5 whitespace-pre-wrap">
            {line || ' '}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RawMarkdownView;
