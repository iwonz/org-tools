## Why

The containerized development server and toolbox currently share the bind-mounted Next.js output
directory. A second Compose project or a toolbox production build can therefore reuse a live
development lock, restart the application, and fail CI before the browser probe.

## What Changes

- Isolate the application development server's `.next` output and dependency mounts in
  Compose-project-scoped volumes.
- Keep toolbox production builds and publication scans on the checkout output path.
- Keep the externally bound Backup directory traversable for host-side validation after the
  non-root container takes ownership, while encrypted files remain mode `0600`.
- Verify a clean ephemeral PostgreSQL stack and concurrent Compose projects without Next.js lock
  collisions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `container-delivery`: require isolated, disposable development build output for each Compose
  project.

## Impact

The development Compose override gains disposable non-database volumes and the Backup directory
preparation mode changes from `0700` to `0711`. Runtime State, PostgreSQL, production images, APIs,
localization, and user-visible behavior do not change.
