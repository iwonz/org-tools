## Why

The current View-local open-position model is limited to manual Units, mixes vacancy data with presentation color, and cannot report planned staffing separately from Employee headcount. Replace it with a first-class Staffing Slot that can be distributed across any Unit while remaining isolated from global Employees and the Units section.

## What Changes

- **BREAKING** Replace every persisted `openPositions` record and `openPosition` reference with `staffingSlots` and `staffingSlot` references. A slot has a UUID, optional normalized name, and dated or undated global Tag assignments.
- Allow Staffing Slots in both manual and Live Units, with create, edit, delete, selection, multi-slot drag, Unit/View copy, anchors, virtualization, and matching Editor PNG behavior.
- Remove open-position background colors, Employee replacement, and Employee-drop consumption. An unnamed slot renders with the localized Staffing Slot label.
- Add separate direct and descendant Staffing Slot counts beside distinct Employee counts in every Editor Unit header without changing the Units section or Employee-oriented projections.
- Convert the owned immediately previous SQLite snapshot once outside runtime, retaining a timestamped backup. Runtime parsing remains current-only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Replace open-position rows with Staffing Slots, add cross-Unit slot movement, and add separate Unit summary counts with DOM/PNG parity.
- `organization-views`: Keep Staffing Slots isolated inside their owning View and preserve them across View and Unit copying, including Live Units.
- `state-transfer`: Replace the exact persisted open-position shape and keep Employee-oriented exports independent from Staffing Slots.
- `project-tooling`: Replace open-position browser and screenshot evidence with Staffing Slot lifecycle, geometry, counts, and migration coverage.

## Impact

The public TypeScript model, exact State parser, Editor store, canvas anchors, clipboard, DOM and Canvas renderers, fixtures, tests, six locale catalogs, canonical specifications, and product documentation change. No remote service, telemetry, dependency, or organization-data transfer is introduced. Existing open-position background colors and replacement behavior are intentionally removed; the ignored SQLite backup is the only retained copy of discarded colors.
