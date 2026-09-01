## Context

The Units detail pane currently reserves vertical space between the shared header and hierarchy,
uses different horizontal insets for search/breadcrumbs and Employee rows, and repeats the selected
Unit Employee count in a descriptive label. The Calendar dated-tag dialog uses a compact bespoke
row that lacks the established Employee actions. MCP management already uses shared tabs and buttons
but does not give those controls thematic icons.

The changes span three existing client surfaces while preserving the singleton state flow, local
SQLite boundary, MCP control API, static Pages isolation, and the current 43-frame gallery.

## Goals / Non-Goals

**Goals:**

- Make the Units hierarchy and detail pane visually continuous with the shared content header and
  align controls with the Employee avatar column.
- Reuse the Employee catalog row presentation and actions in the Calendar dated-tag dialog.
- Add trailing thematic icons to MCP Setup/Activity tabs and Enable/Disable actions.
- Preserve responsive behavior, keyboard access, localization, virtualization, and console safety.

**Non-Goals:**

- Changing Unit hierarchy behavior, Employee actions, Calendar event semantics, MCP authorization,
  persistence, or protocol schemas.
- Adding new translations, dependencies, API routes, state fields, or Pages MCP code.
- Changing the number or purpose of screenshot scenarios.

## Decisions

1. **Adjust existing pane geometry rather than adding wrapper surfaces.** The Units hierarchy starts
   at the content boundary with no decorative spacer. Search and breadcrumbs use the same horizontal
   inset as Employee avatars, and the selected Unit count is rendered below search using the existing
   compact catalog-count treatment. This preserves the split-pane architecture and avoids another
   bordered container.

2. **Reuse the established Employee row composition in the tag dialog.** The Calendar tag dialog
   derives live Employee objects from the same store indexes and renders avatar, identity metadata,
   tags/assignments where available, and the same Tag/Edit/Delete action cluster. The dialog retains
   its current bounded scrolling and re-derives after mutations instead of retaining snapshots.

3. **Keep icons inside the existing accessible controls.** MCP tab labels and Enable/Disable labels
   remain visible and localized; icons follow their labels without changing tab order or control
   geometry. Shared icon components are decorative because the text remains the accessible name.

4. **Verify through existing browser and screenshot infrastructure.** Browser assertions cover
   alignment, removed labels, complete Calendar actions, icon order, both themes/locales, Pages MCP
   absence, and console/network diagnostics. The existing 43 screenshot identifiers are regenerated
   rather than expanded.

## Risks / Trade-offs

- **Shared Employee-row reuse could overfill the dialog.** → Keep rows compact and virtualized inside
  the existing bounded viewport; assert right-aligned actions remain reachable at maintained widths.
- **Removing pane insets could misalign nested hierarchy controls.** → Use one explicit content inset
  shared by search, breadcrumbs, and Employee rows and cover its computed geometry in browser tests.
- **Icons could duplicate accessible names.** → Mark icons decorative and retain localized text on
  every tab and action.
