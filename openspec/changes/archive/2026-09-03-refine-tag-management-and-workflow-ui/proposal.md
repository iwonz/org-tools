## Why

Several high-use surfaces still expose inconsistent layering, dense card chrome, fixed Import targets,
and visual output that does not preserve Tag colors. These rough edges make Tag maintenance,
Employee transfer, Calendar scanning, and image export less direct than the rest of the product.

## What Changes

- Make the exact-color type selector render above its enclosing color Popover.
- Flatten Tag catalog rows, move color selection to a dedicated row action, retain rename in a
  separate modal, and add a full Employee roster for each Tag.
- Add bundled flag icons to the six-language selector.
- Move the selected Unit roster count immediately below its Employee search.
- Give real weekend headings and dates a restrained rose treatment in both themes.
- Replace fixed Employee Import targets with one selectable Org Tools target for every discovered
  source JSON path while retaining strict validation, staged custom fields, and bounded review.
- Paint the configured named or custom Tag fill and readable foreground in Editor PNG output.
- Expand the maintained screenshot gallery from 46 to 48 PNG files.
- Preserve local-only operation, the current strict state contract, SQLite shape, API routes, and
  full-state Import/Export behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tag-catalog`: Define flat catalog rows, quick color editing, and Tag Employee drill-down.
- `state-transfer`: Make Employee mapping source-driven with selectable unique targets.
- `data-export`: Preserve catalog Tag colors in Editor PNG output.
- `interface-chrome`: Define nested floating-surface layering and revised Unit roster geometry.
- `interface-localization`: Localize new Tag, mapping, and language accessibility surfaces.
- `organization-editor`: Apply rose weekend treatment without weakening current-day emphasis.
- `project-tooling`: Expand and validate the updated screenshot scenarios.

## Impact

The change affects shared Radix surface primitives, Tag catalog and color controls, the Language
dialog, Unit and Calendar layouts, Employee Import mapping state, the canvas image renderer, tests,
documentation, and screenshot fixtures. It adds six small bundled flag SVGs but no runtime network
requests or third-party service. No public state or server interface changes, migrations,
compatibility readers, telemetry, or browser persistence are introduced.
