## Why

The built-in Editor View is currently exposed through a dedicated “Main” label, which is less
direct than the product's existing localized Units terminology. Custom View deletion already
exists for populated Views but disappears on an empty custom canvas, so not every custom View can
actually be removed from the interface.

## What Changes

- Present the built-in canonical View with the localized Units destination term throughout
  user-facing Editor workflows and related messages.
- Keep the built-in View non-deletable and non-renamable.
- Keep Rename and Delete available for every active custom View, including an empty custom View.
- Require an explicit destructive confirmation, then delete the custom View, switch to the
  built-in View, and discard deleted View UI references without affecting canonical organization
  data.
- Preserve the current `OrgToolsState`, SQLite storage, Import/Export format, MCP contract, and
  local-only privacy boundary.
- Do not add View recovery, trash, history across deletion, or compatibility aliases for the old
  display label.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Rename the built-in View presentation and make confirmed deletion
  available for every custom View while protecting the built-in View.
- `interface-localization`: Keep the renamed built-in View and deletion workflow complete and
  consistent in English and Russian.

## Impact

The change affects the Editor View toolbar, message catalogs, View-store cleanup, browser and unit
coverage, documentation, canonical capability specifications, and Editor screenshots. It does not
change network behavior, persistence schemas, dependencies, or public state files.
