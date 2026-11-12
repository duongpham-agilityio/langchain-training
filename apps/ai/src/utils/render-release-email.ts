// Schemas
import type { Release } from "@/schemas";

// Utils
import { escapeHtml } from "./escape-html";

/**
 * Pure renderer for the release email. Inline styles only (mail clients drop <style>),
 * and every string from the release goes through `escapeHtml`.
 */
export const renderReleaseEmail = (release: Release): { subject: string; html: string } => {
  const subject = `Release ${release.version} (${release.date})`;

  const items = release.changes
    .map((change) => {
      const refs = change.refs?.length ? ` (${change.refs.map(escapeHtml).join(", ")})` : "";
      const breaking = change.breaking ? "<strong>BREAKING</strong> " : "";
      return `<li style="margin:0 0 8px 0;"><strong>${escapeHtml(change.type)}</strong>: ${breaking}${escapeHtml(change.description)}${refs}</li>`;
    })
    .join("");

  const html = [
    "<!doctype html>",
    '<html><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">',
    `<h1 style="font-size:20px;margin:0 0 4px 0;">Release ${escapeHtml(release.version)}</h1>`,
    `<p style="margin:0 0 16px 0;color:#52606d;">${escapeHtml(release.date)}</p>`,
    `<p style="margin:0 0 16px 0;">${escapeHtml(release.openingLine)}</p>`,
    `<ul style="margin:0;padding-left:20px;">${items}</ul>`,
    "</body></html>",
  ].join("");

  return { subject, html };
};
