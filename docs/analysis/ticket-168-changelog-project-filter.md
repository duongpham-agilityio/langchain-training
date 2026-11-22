# Ticket 168: [IP-02d] Changelog project filter (¼ day)

## What it asks
Feature. The Changelog lists releases of all projects and shows each one's project name. A project dropdown in `ChangelogFilters` (default: all projects) filters the list; the Changelog API takes an optional project filter.
Done when: Changelog filters by project and shows all projects by default. Proof: preview screenshots with two projects.

## What's ambiguous
- "Changelog keeps all releases" - read as: no project is selected by default, so nothing is hidden.
- The web has no project list client yet (sidebar/History is #167, another session).

## First step
Add `projectId` to the changelog query schema and `projectId`/`projectName` to the changelog entry contract, then the SQL.

## Clarifying questions
No ambiguity: the ticket and the History route (`?projectId=`, 404 for a foreign project) already set the pattern.
