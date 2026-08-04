## Why

Save currently emits two different machine contracts while import exposes separate full-state, structured, examples, and Employee-only mapping paths. A single scoped state contract and one adaptive import flow make local transfer understandable, while the tag UI and image renderer need to stop hiding data and exposing date inputs by default.

## What Changes

- **BREAKING** Remove the public `org-tools-import` contract and use one unversioned `OrgToolsState` with a `content` discriminator for Teams, Employees, Teams + Employees, or Full workspace.
- Save all four header choices as strictly validated scoped states with the existing filenames.
- Detect a selected state, offer only compatible data projections, and support append or complete replacement for partial projections; Full workspace always replaces with a destructive warning.
- Remove the Formats & examples tab and route non-state JSON/CSV through an append-only mapper for manual Teams, Employees, or nested/related Teams + Employees.
- Keep identity matching, UUID remapping, Live semantics for state imports, detached candidate validation, and browser-only processing.
- Hide tag date inputs behind accessible calendar actions, show localized dates after a middle dot, and preserve bulk mixed-date behavior.
- Show every Employee tag with wrapping on cards, lists, the Org Editor, and PNG output; make editor/export geometry account for variable tag rows.
- Remove logo shadows while retaining the restrained gradient and accessible name.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace-state`: Add scoped content invariants and partial projection/replace behavior to the sole state contract.
- `structured-save`: Emit the same scoped state contract for all four Save choices.
- `structured-import`: Replace the separate additive contract with state projection selection, append, and replace-all workflows.
- `tabular-import`: Map ordinary JSON/CSV to Teams, Employees, or Teams + Employees with nested JSON and relational CSV support.
- `dated-employee-tags`: Replace persistent date controls with calendar popovers and show all dated chips.
- `organization-editor`: Support wrapped tag rows and variable employee geometry across canvas interaction.
- `data-export`: Render all localized dated tags in wrapped PNG rows.
- `interface-localization`: Localize the revised transfer, mapping, tag-date, warning, and accessibility surfaces.
- `privacy-safety`: Preserve local-only atomic processing across every new transfer path.
- `project-tooling`: Validate the unified state, generic mappings, screenshots, and variable tag geometry.

## Impact

This affects the shared state type, file parsers/serializers, import session and organization stores, save/import dialogs, generic mapping models, Employee tag components, Org Editor layout and image export, message catalogs, fixtures, browser tests, screenshots, documentation, and capability specs. Current `org-tools-import` files become ordinary JSON requiring explicit mapping, consistent with the current-schema-only policy. Filenames, UUID persistence, locale storage, tabular Export fields, organization data, and privacy boundaries otherwise remain unchanged.
