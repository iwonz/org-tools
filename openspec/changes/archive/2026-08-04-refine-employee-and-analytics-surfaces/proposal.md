## Why

Successful replacement imports currently leave a redundant full-width file banner, the populated
Employees surface does not expose catalog size, and Analytics uses repeated rules plus fixed-height
sections that create visual noise and large empty gaps. These surfaces need a quieter, more
informative layout without changing workspace data or workflows.

## What Changes

- Remove only the global opened-file success banner after partial or full replacement import while
  retaining errors, append summaries, and export feedback.
- Add a localized populated-Employees header that shows the total catalog size and, while searching
  or filtering, the visible match count.
- Render Analytics as responsive two-column borderless lists separated by whitespace, with one
  retained surface-header divider and content-sized sections capped at eight visible rows before
  internal scrolling.
- Preserve sorting, virtualization, loading and empty states, drill-down dialogs, narrow-screen
  stacking, and the full-name duplicate section spanning both desktop columns.
- Update localized catalogs, browser coverage, deterministic screenshots, documentation, and
  capability specifications.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Define the populated Employees counter and the cleaner, content-sized
  Analytics surface.
- `structured-import`: Define silent successful completion for replacement imports while retaining
  append feedback and errors.

## Impact

The change affects the application shell import callback, Employees and Analytics components,
English and Russian catalogs, browser tests, screenshots, and user-facing documentation. It adds no
dependencies, storage, network requests, state migrations, or public schema changes; organization
data remains browser-local and the existing performance targets remain in force.
