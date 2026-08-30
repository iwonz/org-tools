## Why

The first successful GitHub Pages deployment exposed deprecation annotations for older JavaScript
action runtimes and an unsupported upload input on the pinned Pages artifact action. Refreshing the
official action majors keeps CI and publication warning-free and makes the existing hidden-file
upload contract effective.

## What Changes

- Upgrade the official checkout, Node setup, pnpm setup, artifact, and Pages actions to their current
  supported major versions.
- Keep the existing least-privilege workflow permissions, deterministic artifact, and explicit
  publication command unchanged.
- Validate and republish the showcase, confirming that the workflow completes without the previous
  action-runtime or unsupported-input annotations.
- Preserve the public `OrgToolsState`, local SQLite runtime, privacy boundary, and product UI.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Require repository automation to use supported official action runtimes and
  valid inputs.

## Impact

This change affects only `.github/workflows/ci.yml`, `.github/workflows/pages.yml`, repository
automation documentation/specification, and the republished GitHub Pages deployment. It adds no
runtime dependency, external application request, state migration, or public API change.
