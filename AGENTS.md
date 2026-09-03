# Agent guide

This repository uses OpenSpec as its only change-management workflow. Before changing the
repository, create or continue an OpenSpec change and read its proposal, design, tasks, and relevant
capability specifications.

Run OpenSpec through `pnpm spec -- <command>` so the repository wrapper disables CLI telemetry.

## Product invariants

- The application is local-only. Organization data may stay in browser memory, move through an
  explicit state Import or Export, or travel between the browser and the loopback same-origin Org
  Tools runtime; it must never be sent to a third party or remote service.
- Do not add telemetry, analytics SDKs, remote logging, remote synchronization, or background
  requests.
- Persist the server-mode singleton state only in the configured local SQLite database. Browser mode
  keeps organization state only in live tab memory and synchronizes live tabs through
  `BroadcastChannel`. Do not persist organization snapshots in cookies, IndexedDB, Cache Storage,
  session storage, local storage, or service workers. Theme and locale are the only allowed browser
  metadata.
- Employee avatars are bounded embedded PNG, JPEG, or WebP data URLs. Never fetch remote avatars.
- Employee IDs are stable UUID v4 values. Detect duplicates separately through the normalized
  first-name, last-name, and email tuple; identity edits must never change the Employee ID.
- The system View is the canonical Unit structure used by Units, Employee Import, and Analytics.
  Custom Editor Views may own isolated Unit documents, assignments, rules, history, and geometry,
  while Employees, custom fields, and Tags remain one global catalog shared by every View.
- Profile and email navigation must require an explicit user action and use referrer protections.
- Source comments, fixtures, tests, specifications, and documentation are English. Non-English
  product copy is allowed only in its matching catalog under `apps/ui/messages/{locale}.json` for
  `zh`, `ru`, `es`, `fr`, and `ar`; all other public engineering text remains English. Every UI
  change must keep all six catalogs complete and remove obsolete message keys.
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
- `pnpm dev:check` starts and probes an isolated development server in Chromium, fails on runtime
  browser diagnostics, then stops it.
- `pnpm lint` performs non-mutating Biome checks.
- `pnpm format` applies formatting explicitly.
- `pnpm typecheck` checks all TypeScript workspaces.
- `pnpm test:unit` runs unit tests.
- `pnpm build` creates the production Next.js server application.
- `pnpm test:browser` runs browser smoke tests against both production runtimes. Every owned page
  fails on unexpected console warnings/errors, page errors, and failed application resources.
- `pnpm screenshots:generate` regenerates the PNG gallery.
- `pnpm pages:build` builds the ignored browser-only GitHub Pages application.
- `pnpm pages:dev` starts the browser-only application locally.
- `pnpm pages:check` validates the generated Pages artifact.
- `pnpm pages:publish` publishes Pages from clean synchronized `main`; use it only when authorized.
- `pnpm spec:validate` validates all OpenSpec changes and capability specs strictly.
- `pnpm spec -- <command>` runs any other OpenSpec command with telemetry disabled.
- `pnpm public:check` scans the worktree, production build, and Pages output for publication hazards.

Run `pnpm build` and `pnpm pages:build` before `pnpm public:check`. Never commit
`.org-tools/config.json`, SQLite database files, `apps/ui/next-env.d.ts`, `apps/pages/next-env.d.ts`,
build or Pages output, browser reports, caches, or generated performance fixtures. GitHub Pages is
the functional browser-only editor; it must never contain organization fixtures, telemetry, remote
assets, SQLite code, server chunks, or state API calls.

## Delivery

Every change must complete this closed lifecycle. A task is not delivered while its OpenSpec change,
commit, or branch is still active or unmerged.

1. Fetch the configured origin, switch to `main`, update it without rewriting history, and verify
   that the worktree is clean and local `main` matches `origin/main`. Resolve an existing active
   OpenSpec change before starting unrelated work.
2. Create a short-lived branch named `change/<openspec-change-name>`. Create or continue exactly one
   matching OpenSpec change, then read its proposal, design, tasks, relevant capability specs, and
   required project documentation before implementation.
3. Implement the complete task list on that branch. Keep behavior, tests, documentation,
   screenshots, capability deltas, and checked task status in the same change.
4. Run `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm dev:check`,
   `pnpm build`, `pnpm test:browser`,
   `pnpm screenshots:generate`, `pnpm pages:build`, `pnpm pages:check`, `pnpm public:check`,
   `pnpm spec:validate`, and `git diff --check`. Inspect every generated PNG and regenerate the
   gallery a second time to compare deterministic hashes. Preserve the performance target of 20,000
   Employees and 4,000 Units.
5. Synchronize delta specs into canonical specs, archive the completed OpenSpec change according to
   the repository workflow, validate strictly again, and require `pnpm spec -- list --json` to show
   no active changes.
6. Create meaningful commits, fetch and integrate any new `origin/main` work, merge the change branch
   into `main`, and push `main` to the configured origin. Do not force-push or rewrite shared history.
7. Delete the merged local change branch and its remote counterpart if one was published. Verify
   that `HEAD`, local `main`, and `origin/main` resolve to the same commit, the worktree is clean,
   there are no unique commits on the change branch, and OpenSpec has no active changes.

Do not add an unrequested remote or delete unknown or unmerged work. If the user explicitly forbids
publication, or an external service blocks the final merge or push, stop at the safest clean local
state and report the exact unfinished integration instead of claiming the lifecycle is complete.
