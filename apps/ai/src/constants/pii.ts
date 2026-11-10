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
