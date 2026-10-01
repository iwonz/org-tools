## Why

The Linux CI toolbox runs as container root against a checkout owned by the runner UID. Git rejects
that bind mount as a dubious repository, so the publication scan cannot enumerate tracked files even
though all preceding application checks succeed.

## What Changes

- Mark only `/workspace` as a trusted Git directory for commands running in the development toolbox.
- Keep the trust setting process-scoped through Compose environment variables instead of mutating a
  global Git configuration or the checkout.
- Extend the Compose security regression test and architecture documentation.
- Preserve production image, runtime permissions, application State, PostgreSQL, and Backup behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `container-delivery`: Require the development toolbox to execute repository-aware validation on a
  host-owned bind mount without broad or persistent Git trust.

## Impact

The development Compose toolbox, its configuration test, container-delivery specification, and
architecture documentation are affected. There is no user-visible workflow, data, API, dependency,
or compatibility change, and no external network or privacy impact.
