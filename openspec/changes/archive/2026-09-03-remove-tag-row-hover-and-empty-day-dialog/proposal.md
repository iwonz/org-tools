## Why

Tag catalog rows still behave visually like padded interactive cards even though their actions are
explicit controls, and empty Calendar dates open a dialog with no useful content. Removing those
two dead interaction cues makes both workflows quieter and more predictable.

## What Changes

- Remove hover fill and redundant row padding from the Tag catalog list while preserving its action controls.
- Make Calendar dates open the day dialog only when they contain a birthday or dated Tag assignment.
- Keep empty dates visually consistent and non-interactive without changing state, persistence, APIs, or export formats.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tag-catalog`: Tag list rows become unpadded and have no row-level hover effect.
- `organization-editor`: Calendar day dialogs open only for dates with current events.

## Impact

The change is limited to Tag catalog row presentation, Calendar day interaction, browser coverage,
screenshots, and corresponding specifications/documentation. It does not change `OrgToolsState`,
SQLite, public APIs, localization contracts, network behavior, or runtime privacy boundaries.
