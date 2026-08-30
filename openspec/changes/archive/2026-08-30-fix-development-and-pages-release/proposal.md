## Why

The local development entry point needs a deterministic health check so a server that starts but
cannot serve the application is not treated as working. The public repository also needs an
official GitHub Pages presence, but the SQLite-backed product cannot be represented honestly by a
static deployment.

## What Changes

- Make the development command and package-manager configuration warning-free and add a bounded
  loopback dev smoke command that starts the real Next.js development server, verifies its project
  redirect and API, then shuts it down.
- Add a deterministic, repository-generated static Pages showcase built only from reviewed English
  copy and synthetic screenshot assets.
- Add an explicit Pages build command and an explicit publication command backed by a GitHub Actions
  Pages deployment workflow.
- Document that GitHub Pages is a product showcase, not the SQLite application, and direct visitors
  to the local Node.js runtime for functional use.
- Extend CI and publication safety checks to validate the generated Pages artifact without tracking
  build output.
- Preserve the public `OrgToolsState`, project database schema, runtime behavior, and screenshot
  catalog; no application data is uploaded or accepted by the Pages site.

## Capabilities

### New Capabilities

- `public-showcase`: Defines the static GitHub Pages artifact, its local-build and publication
  commands, source content, privacy boundary, and deploy workflow.

### Modified Capabilities

- `project-tooling`: Requires a warning-free, bounded development smoke check and validates the Pages
  artifact during the repository delivery lifecycle.
- `privacy-safety`: Extends publication safeguards to ensure the public showcase contains only
  reviewed repository content and synthetic screenshots, never organization data or a remote app.

## Impact

The root package scripts, pnpm workspace configuration, development smoke tooling, public-safety
scanner, GitHub Actions workflows, README, architecture/privacy/usage documentation, and capability
specifications change. A generated Pages output directory is ignored and remains outside commits.
GitHub repository Pages settings and its `github-pages` deployment environment are updated during
delivery. There are no new application dependencies, external runtime requests, state migrations,
or public API changes.
