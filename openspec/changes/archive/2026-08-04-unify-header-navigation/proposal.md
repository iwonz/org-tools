## Why

The separate wordmark and product-navigation rows consume vertical space without adding useful
context. A single compact header makes the six product surfaces and file actions easier to scan,
while a flag-only locale control reduces visual noise.

## What Changes

- Remove the visible Org Tools wordmark and place the product tabs on the left side of the sole
  56 px application header, with locale, theme, Import, and Export actions on the right.
- Rename only the product-navigation label to the short localized `Editor` term in both languages
  while retaining internal identifiers and descriptive organization-editor copy.
- Render only the selected flag in the locale trigger while keeping flag, localized language name,
  and selected indicator in the menu.
- Use a matched document-arrow icon pair for Import and Export, and hide their visible labels below
  1024 px while preserving localized accessible names and tooltips.
- Keep the tab strip horizontally scrollable on narrow viewports without page-level overflow.
- Preserve all state, import, export, privacy, and storage behavior; no public data contract changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Require the single-row header, short Editor label, absent wordmark, and
  responsive tab navigation.
- `interface-localization`: Require a flag-only locale trigger and flag-plus-name menu.
- `interface-chrome`: Define the unified header layout and narrow-screen containment.
- `structured-save`: Require the thematic Export action without changing download behavior.
- `project-tooling`: Cover the unified header and responsive controls in browser tests and the
  deterministic screenshot gallery.

## Impact

The change affects the application shell, locale selector, translation catalogs, browser tests,
screenshots, and product documentation. It reuses the installed Heroicons package, makes no network
requests, adds no dependencies, and does not alter `OrgToolsState`, persisted tab identifiers,
filenames, imported content, or exported content.
