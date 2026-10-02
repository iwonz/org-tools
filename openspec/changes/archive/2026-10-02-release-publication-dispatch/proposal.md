## Why

Release Please uses the repository `GITHUB_TOKEN`, so its SemVer tag and GitHub Release do not
trigger the separate tag-based Container workflow. A merged release PR can therefore publish the
release notes and changelog without publishing the matching versioned GHCR image.

## What Changes

- Explicitly dispatch the Container workflow for the exact tag returned by Release Please after a
  release is created.
- Keep the existing tag and `main` push triggers for manual releases and ordinary edge images.
- Preserve the restricted default `GITHUB_TOKEN` policy and grant only the workflow-level Actions
  permission needed for the dispatch.
- Document the reviewed release PR, GitHub Release, and versioned image publication sequence.
- Keep release PR review and merge manual; do not auto-merge or introduce a long-lived PAT.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `container-delivery`: A Release Please-created stable release explicitly starts the existing
  multi-platform Container workflow for the released tag.

## Impact

The change affects `.github/workflows/release.yml`, `.github/workflows/container.yml`, release
documentation, and the `container-delivery` capability. Application runtime, State, PostgreSQL,
organization data, and public APIs are unchanged. No new dependency, remote data flow, or persistent
secret is introduced.
