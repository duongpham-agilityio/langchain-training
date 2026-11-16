// Phone numbers are not built into piiMiddleware. Patterns are deliberately strict so commit
// SHAs, dates, versions and PR numbers in pasted logs are left alone.
export const PHONE_PATTERNS = [
  // International: +84 912 345 678, +1 (415) 555-2671
  /(?<![\w+])\+\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{2,4}){2,4}(?!\w)/g,
  // US style: 415-555-2671, (415) 555-2671, 415.555.2671
  /(?<![\w-])\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?![\w-])/g,
  // Local style starting with 0: 0912345678, 0912 345 678
  /(?<![\w.-])0\d{2,3}[\s.]?\d{3}[\s.]?\d{3,4}(?![\w.-])/g,
];

/** Appended to the system prompt: personal data is redacted from the input, so the placeholders must not reach the notes. */
export const PII_PLACEHOLDER_RULE = `
# Redacted personal data

Email addresses and phone numbers in the user's text are replaced by placeholders such as [REDACTED_EMAIL] and [REDACTED_PHONE]. Never write a placeholder in release notes, summaries or any output. Describe the change without the contact detail (for example "notified the user when a login failure occurred").
`;
