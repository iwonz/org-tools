## Why

The Editor currently exposes only the canonical Unit structure, so users cannot preserve the live
organization while exploring alternative structures. Unit cards also repeat Employee Tags without
providing a compact direct-membership summary, and the intentionally flat Tag catalog now needs
spacing between otherwise adjacent rows.

## What Changes

- Add one protected system View, displayed as the localized Units destination, and isolated custom
  Views that contain their own Unit hierarchy, memberships, rules, layout, and geometry while using
  one global Employee, custom-field, and Tag catalog.
- Add View selection, blank/copy creation, rename, and confirmed deletion to the Editor. Copies may
  use any existing View, remap every Unit reference, preserve the source viewport, and start with no
  selection or history.
- Keep Units, Employee Team assignment, Employee Import, and Analytics bound to the system View.
  Add an explicit View source to Data Download, while Editor export uses the active View.
- Add a wrapped tonal Tag summary footer to expanded Unit cards. Counts use only direct resolved
  membership and the footer participates in canvas and PNG geometry.
- Add vertical spacing between padding-free, hover-free Tag catalog rows.
- **BREAKING** Replace the single `organization.structure` state with strict View documents and
  per-View Editor UI state. Reject obsolete single-structure state files after a one-time guarded
  conversion of the owned local SQLite snapshot.
- Preserve local-only operation, the singleton SQLite table, same-origin state API, Pages
  memory-only behavior, and the existing Employee identity contract.

## Capabilities

### New Capabilities

- `organization-views`: System and custom View lifecycle, isolation, cloning, global Employee
  propagation, and source selection semantics.

### Modified Capabilities

- `single-state-runtime`: Persist strict View documents and bounded per-View UI state.
- `organization-editor`: Select and manage Views and render direct Tag summaries in Unit cards.
- `data-export`: Select a View source for Data Download and use the active View for Editor export.
- `state-transfer`: Transfer only the new strict multi-View state and import Employee Teams into the
  system View.
- `organization-analytics`: Keep Analytics bound to the system View.
- `tag-catalog`: Space flat Tag rows and propagate Tag lifecycle changes across Views.
- `employee-model`: Propagate global Employee changes and reference cleanup across Views.
- `interface-localization`: Localize View management across all six catalogs.
- `project-tooling`: Validate, document, test, and capture the new View workflows and Unit footer.

## Impact

Shared state types, strict parsing, MobX ownership, derived Unit indexes, Editor and Download UI,
canvas geometry, PNG rendering, tests, fixtures, translations, docs, and capability specs change.
The SQLite schema and HTTP route shapes do not change. No remote services, telemetry, browser state
storage, runtime compatibility readers, or alternate Employee copies are introduced.
