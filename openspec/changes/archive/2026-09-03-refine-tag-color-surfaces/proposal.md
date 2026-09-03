## Why

Tag colors currently appear as small leading dots while the Tag surfaces keep an unrelated neutral
fill. This weakens the visual association between a Tag and its configured color and adds decorative
noise throughout dense Employee and Calendar workflows.

## What Changes

- Remove leading color dots from Tag chips, Tag pickers, the Tag catalog, and Calendar Tag controls.
- Apply each configured Tag color as a restrained, readable tonal fill on the Tag surface itself in
  light and dark themes.
- Keep Tags without a configured color on the existing neutral treatment and preserve all Tag data,
  actions, dates, selection behavior, accessibility, and performance.
- Refresh tests, documentation, and affected screenshot scenarios.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tag-catalog`: Tag colors become the fill of Tag surfaces rather than a separate leading marker.
- `interface-chrome`: Colored Tag surfaces retain the restrained visual system without added borders,
  geometry changes, or decorative indicators.
- `project-tooling`: The deterministic gallery documents the revised Tag color treatment.

## Impact

The change affects shared Tag presentation helpers and the Employee, Tag catalog, Calendar, filter,
and assignment controls that consume them. It does not change `OrgToolsState`, SQLite, Import/Export,
network behavior, dependencies, or the public Tag palette.
