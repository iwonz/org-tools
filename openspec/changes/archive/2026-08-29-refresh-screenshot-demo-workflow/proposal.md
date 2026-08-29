## Why

The current screenshot gallery mixes core workflows with secondary editing details, while the
README exposes only part of that set. Important product paths such as Teams and language selection
are missing, and the Download preview does not demonstrate a completed selection, so the public
demo does not communicate the whole product coherently.

## What Changes

- Replace the existing mixed screenshot set with a curated ten-image product demo covering Import,
  workspace Export, theme, language, Teams, Employees, Editor, Analytics, Calendar, and Download.
- Capture every scenario from one deterministic synthetic workspace against the production build,
  with meaningful populated states, explicit locale/theme menus, and direct full-size README links.
- Remove superseded PNGs and keep README, screenshot documentation, generator assertions, and the
  generated gallery in one exact scenario manifest.
- Make the complete repository change lifecycle mandatory: begin from a clean up-to-date `main`,
  use one short-lived `change/<openspec-change-name>` branch, complete one OpenSpec change, run the
  full validation and screenshot cycle, sync and archive the change, create a meaningful commit,
  merge and publish `main`, remove merged branches, and finish with no active or unmerged work.
- Document an explicit exception only when a user forbids publication or an external blocker makes
  the final merge or push impossible; the unfinished state must then be reported rather than hidden.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Require complete core-workflow screenshot coverage and an end-to-end clean
  start, OpenSpec, validation, archive, commit, merge, push, and cleanup delivery lifecycle.

## Impact

The change affects `AGENTS.md`, contributor and screenshot documentation, the README gallery,
Playwright screenshot scenarios, generated PNG assets, and the canonical project-tooling
specification. It does not change product behavior, organization state, public file contracts,
runtime dependencies, privacy boundaries, performance targets, or network behavior. All demo data
remains obviously synthetic and all captures remain local and deterministic.
