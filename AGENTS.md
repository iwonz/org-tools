# Agent guide

This repository uses OpenSpec as its only change-management workflow. Create or continue exactly
one change before editing, and read its proposal, design, tasks, relevant capability specifications,
and project documentation. Run OpenSpec as `pnpm spec -- <command>` to disable CLI telemetry.

## Product invariants

- One installation serves one organization. PostgreSQL is the only runtime store. Organization
  documents, security data, per-account UI, sessions, audit, and rate limits stay inside the
  configured deployment.
- Do not add telemetry, analytics SDKs, remote logging, remote synchronization, remote assets, or
  background third-party requests.
- The browser receives only an account's authorized projection. Hidden fields, Tags, Employees,
  Units, staffing slots, Views, counts, search values, labels, Download data, and PNG content must
  be absent from payloads as well as hidden in UI. Every mutation requires server authorization.
- Authentication uses same-origin secure sessions, session-bound CSRF, exact Origin and Fetch
  Metadata checks. Never log passwords, setup/session/CSRF tokens, backup passphrases, or hidden
  values.
- Database schema changes use checked forward-only SQL migrations under an advisory lock. The app
  role never owns the schema and the app must reject pending or unknown migrations.
- PostgreSQL data and backups use absolute external bind paths from `.env`. Never commit `.env`,
  database files/directories, dumps, backups, organization fixtures, or credentials. `.env.example`
  is the only tracked environment file.
- Backup/Restore is the supported complete transfer boundary. Data Download and image export are
  account-authorized outputs. Old State Import/Export and Employee Import do not exist.
- Employee avatars are bounded embedded PNG, JPEG, or WebP data URLs. Never fetch remote avatars.
- Employee IDs are stable UUID v4 values. Duplicate detection is separate from identity. Linked
  account and Employee email changes are atomic Administration actions.
- The system View owns canonical Unit relationships and Manager scopes. Custom Views isolate their
  Unit documents while Employees, custom fields, and Tags remain global.
- Persistent Editor presentation changes require matching DOM and PNG behavior and tests.
- Source, fixtures, tests, specs, and docs are English. Non-English copy belongs only in the six
  message catalogs. Fixtures use `example.test`, fictional names, reserved `555-01xx` phones, and
  embedded or initial avatars.

## Documentation

Read and update the relevant file: `docs/architecture.md`, `docs/privacy.md`,
`docs/performance.md`, `docs/usage.md`, and `docs/screenshots.md`. Keep README concise.

## Commands

Local development and validation run through Docker Compose; Docker and Git are the only host
requirements.

- `./bin/org-tools env init` creates a protected `.env` and external storage directories.
- `./bin/org-tools dev -d` starts PostgreSQL, migrations, app, and toolbox with hot reload.
- `./bin/org-tools run <command>` runs a repository command in the toolbox.
- `./bin/org-tools down` stops the stack without deleting external database data.
- `./bin/org-tools reset-super-admin-password` runs the local interactive recovery command.
- `./bin/org-tools docker-run` runs the supported raw Docker flow.
- Validation commands are `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`,
  `pnpm dev:check`, `pnpm build`, `pnpm test:browser`, `pnpm screenshots:generate`,
  `pnpm public:check`, `pnpm spec:validate`, and `git diff --check` through the toolbox.

Build before `public:check`. Never commit `.env`, `apps/ui/next-env.d.ts`, `.next`, browser
reports, generated performance fixtures, database material, or backup material.

## Delivery

1. Fetch origin, update clean `main` without rewriting history, and resolve any active change.
2. Create `change/<openspec-name>` and one matching OpenSpec change.
3. Implement code, tests, docs, locales, screenshots, and checked tasks together.
4. Run the full containerized validation set, PostgreSQL migration/restart tests, production image
   inspection, and performance checks. Generate all 56 PNGs twice, compare SHA-256, and inspect each.
5. Sync delta specs, archive the change, validate strictly, and confirm no active changes.
6. Commit, integrate fresh `origin/main`, merge into `main`, and push without force.
7. Verify Release Please, GitHub Release, public multi-arch GHCR tags/attestations, clean matching
   refs, and delete the merged branch.

Do not delete unknown or unmerged work. If an external service blocks publication, leave the safest
clean local state and report the exact unfinished step.
