## Why

The default development command can serve successful HTTP responses while the first browser load
stalls on the Next.js `Rendering…` overlay because writes to the repository-local ignored SQLite
runtime retrigger the development watcher during navigation. The existing development probe misses
this failure because its database lives outside the watched repository and it validates server HTML
and APIs without confirming that the browser reaches the interactive application.

## What Changes

- Run the local SQLite development application through the same explicit webpack compiler family
  already used by its production build.
- Warm the root route, current project, and project API before presenting the development workspace
  as ready, so the first browser does not hydrate across the initial route compilation.
- Exclude ignored `.org-tools` runtime state and `.playwright-cli` browser artifacts from webpack
  file watching so local tooling writes do not trigger Fast Refresh.
- Resolve the current project in the Node.js request proxy so `/` returns a real server redirect
  before rendering rather than a timing-dependent streamed redirect.
- Strengthen `pnpm dev:check` so it exercises the documented development command and verifies the
  browser-visible project route rather than treating an HTTP response alone as success.
- Keep the loopback binding, configurable SQLite path, public workspace contract, product behavior,
  privacy boundary, and GitHub Pages runtime unchanged.
- Republish the existing functional browser-only Pages application after the fix is integrated.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Require the development command and probe to use the supported deterministic
  compiler path and confirm that a browser reaches the interactive project workspace.

## Impact

The change affects the `apps/ui` development script, the isolated development probe, focused tests,
and development documentation. It adds no dependency, API, state migration, persistence change,
remote request, or organization-data exposure. GitHub Pages is rebuilt from the unchanged
browser-only architecture and published only after validation and merge.
