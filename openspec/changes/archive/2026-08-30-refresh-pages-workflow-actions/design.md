## Context

The Pages workflow deployed correctly, but GitHub annotated its jobs because several official
JavaScript actions still targeted the deprecated Node.js 20 runtime. The Pages artifact action was
also pinned before support for `include-hidden-files`, so GitHub ignored that declared input even
though `.nojekyll` is part of the validated artifact.

## Goals / Non-Goals

**Goals:**

- Use the current official action majors that run on GitHub's supported Node.js 24 action runtime.
- Use the Pages artifact version that accepts `include-hidden-files`.
- Keep CI and Pages behavior, permissions, and deterministic inputs otherwise identical.

**Non-Goals:**

- Change application runtime dependencies, UI behavior, SQLite persistence, or public state.
- Automate publication on every push or widen workflow permissions.

## Decisions

- Pin official actions by current major (`checkout@v6`, `setup-node@v6`,
  `pnpm/action-setup@v6`, `configure-pages@v6`, `upload-pages-artifact@v5`,
  `deploy-pages@v5`, and `upload-artifact@v7`). Major tags retain normal security and maintenance
  updates while making runtime transitions explicit in review.
- Keep `include-hidden-files: true` because the generated `.nojekyll` file is intentional and
  required in the uploaded Pages artifact; the selected artifact major validates this input.
- Republish only after the normal local validation and closed OpenSpec lifecycle. The explicit
  `pages:publish` guard continues to require clean synchronized `main`.

## Risks / Trade-offs

- [A future GitHub-hosted runner removes Node.js 24 support] → Refresh the official action majors in
  a new validated OpenSpec change.
- [A major action update changes behavior] → Preserve all existing inputs, run the complete local
  suite, and verify the dispatched workflow and public URLs after integration.

## Migration Plan

Update both workflow files, validate locally, merge and push the archived change, then manually
dispatch the Pages workflow. Rollback is a normal revert to the previous workflow commit if the
remote run fails.

## Open Questions

None.
