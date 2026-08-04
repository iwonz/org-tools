## Why

Repeated one-pixel rules split otherwise continuous screens and dialogs into unnecessary visual
bands. Org Tools should use spacing, grouping, and interaction states for hierarchy while retaining
only borders that communicate a real component, pane, calendar, or tree boundary.

## What Changes

- Remove decorative horizontal rules from the application shell, product surfaces, status bands,
  dialog headers and footers, local sections, and list rows.
- Preserve outlines for controls, selectable cards, dialogs, calendar cells, independent split
  panes, hierarchy guides, focus states, and destructive states.
- Replace removed rules with stable spacing, background grouping, and hover or focus feedback.
- Keep long dialogs scrollable with reachable fixed actions and keep narrow Import and desktop
  Calendar layouts free of page-level overflow.
- Update deterministic screenshots and browser assertions for the simplified visual hierarchy.
- Keep all organization data local; no state, import, export, locale, or network behavior changes.

## Capabilities

### New Capabilities

- `interface-chrome`: Shared policy for borderless application chrome, dialogs, sections, and list rows while preserving meaningful boundaries.

### Modified Capabilities

- `organization-editor`: Product surfaces and Analytics no longer retain decorative header or internal card rules.
- `structured-import`: Import mode remains distinct through spacing and cards rather than a horizontal rule.
- `project-tooling`: Browser and screenshot coverage verifies the borderless chrome policy and preserved meaningful outlines.

## Impact

This affects shared Dialog and AlertDialog primitives, the application shell, six product surfaces,
filter and tag popovers, JSON mapping, structured preview, and local export dialogs. The internal
`SelectedEmployeesPanel.withHeaderBorder` option is removed. Public TypeScript contracts,
`OrgToolsState`, file formats, localization catalogs, dependencies, and persistence are unchanged.
