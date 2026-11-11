/** IANA zone of this browser, e.g. `Asia/Ho_Chi_Minh`. */
export const getBrowserTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;
