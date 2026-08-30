## Context

Org Tools now depends on a loopback Next.js server and `node:sqlite`; its mutation endpoints and
filesystem database cannot run on static hosting. The existing root `pnpm dev` starts correctly, but
the repository has no bounded command that proves the development server can initialize an isolated
database, redirect to a project, render the project route, and answer its API. pnpm 10.33.2 also
warns on every invocation because dependency overrides remain in the obsolete `package.json` field.

The repository contains a reviewed 46-frame screenshot manifest and synthetic PNG gallery. That is
the safest source for a public GitHub Pages presence: it explains the product without reintroducing
the former static application or transferring organization data to a public host.

## Goals / Non-Goals

**Goals:**

- Make ordinary pnpm commands warning-free and make the real development startup independently
  smoke-testable.
- Generate one deterministic static Pages artifact from tracked English metadata and the complete
  synthetic screenshot catalog.
- Deploy that artifact with the supported GitHub Actions Pages artifact workflow and an explicit
  local publication command.
- Validate both the local server build and the static showcase without committing either output.

**Non-Goals:**

- Run the SQLite application, its API, or a reduced organization editor on GitHub Pages.
- Add a hosted database, authentication, telemetry, remote logging, CDN assets, or third-party
  application dependencies.
- Change `OrgToolsState`, SQLite schema, screenshot scenarios, or runtime UX.

## Decisions

### Keep the application server-only and publish a separate static showcase

`pages:build` will create `pages-out/index.html`, copy the manifest-declared synthetic PNGs, and add
`.nojekyll`. The HTML will use inline CSS and no executable JavaScript, remote fonts, analytics, or
runtime API calls. All product-use actions lead to the repository's local-run documentation.

Alternative: restore Next.js `output: "export"` for Pages. Rejected because dynamic project routes,
redirects, request-aware handlers, SQLite writes, and server validation require a Node.js runtime;
an exported UI would be non-functional and misleading.

Alternative: maintain a hand-written second site. Rejected because it would drift from the existing
screenshot manifest. The generator instead treats the manifest as the ordered content source and
fails on missing images or unsafe fields.

### Use an isolated dev probe instead of a long-running test convention

`dev:check` will reserve a free loopback port, create a system-temporary database directory, spawn
the same Next.js development entry point, poll until ready with a hard deadline, verify `/` redirects
to a stable UUID project, verify the rendered project route and `GET /api/projects`, then terminate
the child and remove its temporary database. Child startup output is retained and printed only on
failure.

Alternative: regard a listening socket as sufficient. Rejected because startup can succeed before
route compilation or database initialization fails.

### Use the GitHub-supported artifact deployment workflow

The Pages workflow will run only through `workflow_dispatch`, install the pinned Node and pnpm
versions, build and validate the artifact, upload it with `actions/upload-pages-artifact`, and deploy
through `actions/deploy-pages` to the `github-pages` environment. It receives only `contents: read`,
`pages: write`, and `id-token: write` permissions. The explicit `pnpm pages:publish` command will
require a clean synchronized `main` and authenticated GitHub CLI before dispatching the workflow.

Alternative: commit generated output to `gh-pages`. Rejected because it creates an unreviewed,
long-lived generated branch and conflicts with the repository's closed delivery lifecycle.

### Move pnpm overrides to the current workspace configuration

The Radix overrides move unchanged from `package.json` to `pnpm-workspace.yaml`. This removes the
current pnpm warning without altering the lockfile resolution or dependency graph. The same
workspace configuration explicitly permits install scripts only for the four reviewed dependencies
that currently require them and makes any future unreviewed dependency build fail instead of being
silently skipped.

## Risks / Trade-offs

- [Pages can be mistaken for the hosted product] → The hero, CTA, README, and architecture guide
  explicitly label it as a static showcase and state that working projects run locally.
- [Generated public HTML can drift or include unsafe content] → Build from the strict manifest,
  HTML-escape every value, allow only declared local PNG names, prohibit scripts/remote assets, and
  scan the complete generated artifact in `public:check`.
- [A dev child can leak after failure] → Use an abort deadline, `finally` termination, bounded exit
  wait, and an isolated temporary directory.
- [Manual Pages publishing can use stale code] → Refuse publication outside clean `main` or when
  `HEAD`, `main`, and `origin/main` differ; the remote workflow checks out `main` again.

## Migration Plan

1. Move overrides, add the dev probe, generator, validators, scripts, docs, and workflows.
2. Run the full local validation cycle, including `dev:check` and `pages:build`.
3. Sync capability specs, archive the change, commit, fast-forward into `main`, and push.
4. Configure the repository Pages source for GitHub Actions if it is not already configured.
5. Run `pnpm pages:publish`, wait for the deployment, and verify the public URL and representative
   local image paths.

Rollback is a normal revert of the committed workflow and generator. GitHub Pages can be disabled
without affecting the local application or its database.

## Open Questions

None.
