## Why

Employee display formats currently flatten Tags and positions into plain text and impose first-line
emphasis that users cannot control. The Display editor also lacks lightweight formatting tools, and
its section surfaces add unnecessary visual weight.

## What Changes

- Render inline Markdown emphasis, code, and safe links in all four Employee display formats without
  interpreting Markdown stored in Employee values.
- Restore native colored Tag chips and neutral position badges as semantic format tokens in DOM and
  Editor PNG output, with shared wrapping and geometry.
- Add an opt-in selection toolbar to the four Display format inputs for formatting and creating,
  editing, or removing safe links.
- Give the Model and Display tabs thematic icons and flatten the four Display configuration sections
  while preserving the preview boundary.
- Remove implicit first-line emphasis so every line uses one context-appropriate base style and
  Markdown controls emphasis.
- Keep the exact State contract and persisted format strings unchanged. No SQLite conversion or
  runtime compatibility path is added.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: Define inline Markdown editing and rendering, semantic Tag and position tokens,
  equal base line styling, tab icons, and flat Display sections.
- `organization-editor`: Use rich Employee display rows with deterministic DOM geometry and
  non-interactive safe-link presentation.
- `data-export`: Paint the same Markdown runs, Tag chips, and position badges in Editor PNG output.
- `interface-localization`: Localize and expose accessible names for the Markdown selection tools.
- `privacy-safety`: Restrict Markdown navigation to safe protocols and prohibit remote Markdown
  content fetching.
- `project-tooling`: Keep the deterministic 59-frame gallery and cover the revised Display editor.

## Impact

The shared Employee display renderer, card surfaces, Editor row layout, PNG painter, and token-aware
format input will move from flat strings to one internal rich-line model. The UI package will declare
the Markdown AST utilities it already receives transitively as direct dependencies. Organization
State, Import and Export shape, SQLite schema, and BroadcastChannel payloads remain unchanged.
