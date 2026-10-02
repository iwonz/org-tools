# Contributing

Contributions must preserve the self-hosted privacy boundary, server-enforced access control,
synthetic public data, English engineering artifacts, six complete product catalogs, and accessible
UI conventions.

## Prepare

1. Install Docker and Git.
2. Fetch `origin`, update clean `main`, and confirm no unrelated OpenSpec change is active.
3. Run `./bin/org-tools env init` and `./bin/org-tools dev -d`.
4. Create `change/<short-kebab-name>` and the matching change with
   `./bin/org-tools run pnpm spec -- new change <short-kebab-name>`.
5. Complete and read proposal, design, delta specs, and tasks before implementation.

Never commit `.env`, local paths, secrets, PostgreSQL data, SQLite files, dumps, backups, exported
organization data, or real identities. New persistence changes require checked SQL migrations;
application code may not create or alter schema. Every protected workflow needs direct API tests in
addition to UI gates.

## Validate

Run through the toolbox:

```sh
./bin/org-tools validate fast
./bin/org-tools validate changed --base origin/main
./bin/org-tools run pnpm format
./bin/org-tools run pnpm lint
./bin/org-tools run pnpm typecheck
./bin/org-tools run pnpm test:unit
./bin/org-tools run pnpm hygiene:dead-code
./bin/org-tools run pnpm security:audit
./bin/org-tools-dev-check
./bin/org-tools run pnpm build
./bin/org-tools run pnpm test:browser
./bin/org-tools run pnpm screenshots:generate
./bin/org-tools run pnpm public:check
./bin/org-tools run pnpm spec:validate
```

Also test migrations from empty PostgreSQL, restart, Backup/Restore, the non-root production image,
and external bind persistence. Generate the 56 PNG gallery twice, compare SHA-256, and inspect every
frame. Sync and archive OpenSpec before integration.

## Publish

Merge the completed branch into fresh `main` and push without rewriting history. Release Please
creates the SemVer release PR. Approve the CI workflow held for that bot-created PR, review its
version and `CHANGELOG.md`, and merge it only when that version is intended for publication. Release
Please then creates the tag and GitHub Release and explicitly dispatches the container workflow for
the released tag. The container workflow publishes public multi-arch GHCR tags with SBOM and
provenance. Delivery is complete after refs are clean and equal, the branch is removed, OpenSpec has
no active change, and release/image checks pass.
