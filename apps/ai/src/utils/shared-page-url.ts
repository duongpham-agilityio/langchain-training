import { SHARED_PAGES_PATH } from "@/constants";

/** Public link of a shared page; a trailing slash on the base URL is dropped so the link never has `//shared`. */
export const buildSharedPageUrl = (baseUrl: string, id: string): string =>
  `${baseUrl.replace(/\/+$/, "")}${SHARED_PAGES_PATH}/${id}.html`;
