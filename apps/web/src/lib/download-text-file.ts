// Browser-only: saves `content` as a file through a temporary <a download>.
export const downloadTextFile = (
  fileName: string,
  content: string,
  mimeType = 'text/markdown',
): void => {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
