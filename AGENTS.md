# Agent guide

This repository uses OpenSpec as its only change-management workflow. Before changing behavior,
create or continue an OpenSpec change and read its proposal, design, tasks, and relevant capability
specifications.

Run OpenSpec through `pnpm spec -- <command>` so the repository wrapper disables CLI telemetry.

## Product invariants

- The application is browser-only. Organization data, imported rows, searches, analytics, and
  exports must never be sent to a server or third party.
- Do not add telemetry, analytics SDKs, remote logging, remote synchronization, or background
  requests.
- Do not persist organization data in browser storage. State enters through explicit file open or
  import and leaves through explicit download, copy, or image export.
- Employee avatars are bounded embedded PNG, JPEG, or WebP data URLs. Never fetch remote avatars.
- Profile and email navigation must require an explicit user action and use referrer protections.
- Source comments, fixtures, tests, specifications, and documentation are English. Cyrillic product
  copy is allowed only in `apps/ui/messages/ru.json`; all other public engineering text remains
  English.
- Fixtures must be obviously synthetic. Use `example.test`, fictional names, reserved `555-01xx`
  phone numbers, and embedded or initial-based avatars.

## Architecture and documentation

Read the relevant document before changing these areas:

- `docs/architecture.md` for module boundaries, state flow, or build output.
- `docs/privacy.md` for file handling, rendering, links, storage, or network behavior.
- `docs/performance.md` for derived indexes, store shape, large collections, or rendering.
- `docs/usage.md` for user-visible workflows and terminology.
- `docs/screenshots.md` for browser smoke tests or gallery generation.

Update documentation and OpenSpec capability specs in the same change as documented behavior.
Keep the README concise and link to the detailed documents.

## Commands

- `pnpm dev` starts the local development UI.
- `pnpm lint` performs non-mutating Biome checks.
- `pnpm format` applies formatting explicitly.
- `pnpm typecheck` checks all TypeScript workspaces.
- `pnpm test:unit` runs unit tests.
- `pnpm build` creates the static production application.
- `pnpm test:browser` runs browser smoke tests against the production build.
- `pnpm screenshots:generate` regenerates the PNG gallery.
- `pnpm spec:validate` validates all OpenSpec changes and capability specs strictly.
- `pnpm spec -- <command>` runs any other OpenSpec command with telemetry disabled.
- `pnpm public:check` scans the worktree and an existing production build for publication hazards.

Run `pnpm build` before `pnpm public:check`. Never commit `apps/ui/next-env.d.ts`, build output,
browser reports, caches, or generated performance fixtures.

## Delivery

- Use short-lived branches named `change/<openspec-change-name>` after the repository begins using
  commits.
- Do not add a remote, publish, or push unless the user explicitly asks.
- Preserve the performance target of 20,000 Employees and 4,000 Units.
- Run the checks proportional to the change, then run the complete validation suite before release.
