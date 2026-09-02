## Why

JSON field configuration currently separates Employee fields from Unit and Tag collections and does
not expose the persisted ordering controls, making the final object shape harder to understand and
control. Editor image export also retains redundant preview chrome and inconsistent controls that
make a focused local export feel heavier than necessary.

## What Changes

- **BREAKING** Replace the separate Employee/Unit/Tag top-level JSON ordering fields with one strict
  ordered list containing scalar Employee fields plus the Unit and Tag collections; older state
  documents with the previous Download shape are rejected.
- Render JSON configuration as one sortable list in Data Download and Editor export, with drag and
  drop for top-level fields and nested Unit/Tag fields while retaining naming, selection, validation,
  and exclusions.
- Use one shared visual control for Template multi-Unit row behavior in Data Download and Editor
  export.
- Add thematic leading icons to Editor export scope controls.
- Simplify Editor image export by localizing the default boss label, excluding
  `avatarBase64Url` from its Employee format tokens, removing the expanded-image action/dialog, and
  removing redundant Preview labels.
- Place icon-only title alignment controls beside Title and Size in one row.
- Preserve local-only generation, bounded previews, Image/JSON/Template outputs, and the 20,000
  Employee / 4,000 Unit performance target.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-export`: Define one ordered sortable JSON field list with inline Unit/Tag collection rows and
  a shared Template row-mode control.
- `organization-editor`: Define the simplified Image export, localized boss default, scope icons,
  alignment control, and Editor parity with JSON ordering.
- `single-state-runtime`: Replace the durable Download JSON ordering projection with the strict
  current unified field-order shape.
- `interface-localization`: Cover the localized image boss default and accessible icon-only export
  controls without redundant Preview/Open copy.

## Impact

The change affects Download state types and parsing, export session state, JSON serialization,
shared export settings components, Editor export UI and image defaults, both message catalogs,
unit/browser tests, documentation, OpenSpec specs, the local SQLite UI projection, and the
deterministic screenshot gallery. It adds no dependency, network behavior, remote persistence, or
public API endpoint.
