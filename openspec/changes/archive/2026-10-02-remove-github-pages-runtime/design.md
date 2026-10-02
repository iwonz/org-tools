## Context

The static Pages application and deployment workflow were removed during the authenticated
PostgreSQL transition, but the repository still carries static-export exclusions, a nonexistent
Playwright config reference, and normative Pages wording. GitHub also still serves the last Pages
artifact and retains a live `github-pages` environment.

## Goals / Non-Goals

**Goals:**

- Make the authenticated Next.js/PostgreSQL server the only build, test, and delivery surface.
- Remove every current-source hook that could imply or recreate a Pages/static-export runtime.
- Add a regression check covering repository configuration and workflow files.
- Disable the public Pages site and remove its deployment environment after code integration.

**Non-Goals:**

- Change application State, PostgreSQL schema, authorization, UI, localization, or screenshots.
- Delete historical OpenSpec archives, Git history, release notes, or past deployment audit records.
- Change Release Please or GHCR delivery.

## Decisions

### Enforce the boundary in source validation

A Vitest contract check will inspect current workspace configuration and GitHub workflows for the
removed app/config names, Pages actions, Pages permissions, static-export paths, and a
`github-pages` deployment environment. Archived OpenSpec changes and Git history remain outside
this current-source contract.

This is preferable to relying on the absence of one workflow filename because Pages support used
several independent paths and could otherwise return partially.

### Keep one authenticated browser suite

The existing production Playwright config remains the sole browser configuration. Its stale
`playwright.pages.config.ts` TypeScript include is removed. Canonical specifications are rewritten
to describe the authenticated server runtime and PostgreSQL persistence only.

### Remove live GitHub configuration after integration

Once the server-only commit is on `main`, repository administration will delete the Pages site and
the `github-pages` environment. Past deployments stay as GitHub audit history. Re-enabling Pages
would require an explicit new repository change plus GitHub configuration.

## Risks / Trade-offs

- **A stale Pages artifact remains reachable until repository configuration is deleted.** The
  delivery sequence disables it immediately after the integrated commit and verifies the Pages API
  returns not found.
- **A broad text ban could reject ordinary pagination terminology.** The regression test targets
  Pages-specific paths, actions, permissions, and environment names rather than the generic word
  `page`.
- **Historical archives still mention Pages.** They are intentionally excluded because changing
  completed decision records would destroy useful history.

## Migration Plan

1. Remove current source/config/spec references and pass server-only validation.
2. Merge and push the archived OpenSpec change.
3. Delete the GitHub Pages site, then delete the `github-pages` environment.
4. Verify the Pages API and public site no longer expose a deployment while CI, Release Please, and
   GHCR remain healthy.

Rollback requires reverting the repository commit and explicitly configuring a new Pages source;
GitHub will not silently restore the removed deployment.

## Open Questions

None.
