## Why

Open positions are now easy to identify as vacancies, but every vacancy row has the same transparent
surface. Editors need to color-code an open role or deliberately keep it unfilled while preserving
the row's existing dashed vacancy treatment in both the live canvas and PNG exports.

## What Changes

- Add a required nullable background color to each View-local open position. New positions default
  to no background, and existing positions receive no background during the one-time owned-State
  conversion.
- Add a background control to the create/edit dialog using the existing local Tag color palette,
  custom colors, and a clear `No background` choice.
- Render the selected background behind the complete open-position row without changing its dashed
  outline, dimensions, hit testing, virtualization, anchors, selection, or drop feedback.
- Paint the same persistent background in full-View and Unit/subtree PNG before the vacancy outline.
- Preserve the background through history, View cloning, Unit copy/paste, Import/Export, SQLite,
  and live-tab synchronization; replacement with an Employee continues to remove the vacancy.
- Update validation, documentation, browser coverage, and the deterministic screenshot gallery.
- **BREAKING**: the exact State shape for every open position gains required
  `backgroundColor: EmployeeTagColor | null`; obsolete shapes remain rejected at runtime.

## Capabilities

### New Capabilities

<!-- None. This change extends existing open-position presentation. -->

### Modified Capabilities

- `organization-editor`: Open-position creation, editing, DOM rendering, and Editor PNG rendering
  support an optional persistent background color.
- `organization-views`: View cloning and Unit clipboard operations preserve open-position colors.
- `state-transfer`: The exact current State contract persists and validates the required nullable
  open-position background color.
- `project-tooling`: Browser validation and deterministic gallery evidence cover colored and
  transparent vacancies.

## Impact

The shared Editor types, strict State parser, stores, open-position dialog and row renderer, PNG
painter, fixtures, state tests, Server/Pages browser workflows, six bundled locale catalogs only if
new copy is required, documentation, capability specs, and affected gallery PNGs change. No new
dependency, network request, analytics, global Employee data, data-export inclusion, or runtime
compatibility reader is introduced. The configured owned SQLite snapshot must be inspected and, if
it contains the immediately previous valid shape, converted once offline with a backup before
publication.
