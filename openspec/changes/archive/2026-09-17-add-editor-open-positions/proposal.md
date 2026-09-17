## Why

Teams need to represent approved but unfilled roles without creating fake global Employees. The
Editor currently has no View-local row that can carry Tags, participate in canvas geometry, and be
replaced by a real Employee while preserving attached annotations.

## What Changes

- Add View-local open positions to manual Units with a stable UUID, editable title, and dated or
  undated assignments to the existing global Tag catalog.
- Render open positions as Employee-like Unit rows in the Editor and Editor PNG, with deterministic
  ordering, virtualization, collapse behavior, selection, and left/right canvas anchors.
- Add Unit and open-position context actions for create, edit, replace, and delete. Replacing from
  the picker adds one Employee occurrence; dropping one Employee occurrence moves it according to
  the existing manual-Unit behavior.
- Preserve canvas attachments when an open position is replaced and detach them at their resolved
  world position when the position is deleted.
- Clone and copy open positions only with their containing Unit while remapping their UUIDs and
  internal canvas references.
- Keep open positions out of the global Employee catalog, Employee counts, Analytics, Calendar,
  Distribution mode, and Employee/JSON/Template exports.
- **BREAKING** Add required `openPositions` data to every Unit in the exact current State contract.
  No runtime compatibility reader or migration is added; an owned previous-schema SQLite snapshot
  is converted once outside runtime before publication when present.
- Keep all data and rendering local. This change adds no telemetry, network request, remote asset,
  or persistent browser storage.
- Do not add open positions to Live Units, make them bosses, transfer their Tags to Employees, or
  introduce manual Unit-row ordering.

## Capabilities

### New Capabilities

<!-- None. Open positions extend the existing Editor and View capabilities. -->

### Modified Capabilities

- `organization-editor`: Define open-position rows, interactions, Tags, anchors, replacement,
  geometry, virtualization, and matching PNG behavior.
- `organization-views`: Persist, clone, copy, and remap View-local open positions and attachments.
- `state-transfer`: Replace the exact Unit schema and exclude open positions from Employee-oriented
  exports.
- `project-tooling`: Document and verify the updated Editor gallery and exact-State publication
  preparation.

## Impact

The public TypeScript State types, strict parser, Editor store/history/clipboard, Unit-row layout,
canvas anchor registry, Editor DOM and PNG painters, tag deletion, localization catalogs, fixtures,
browser workflows, screenshots, and architecture/usage/privacy/performance documentation change.
The configured owned SQLite database may require the repository's one-time detached conversion and
backup procedure before integration.
