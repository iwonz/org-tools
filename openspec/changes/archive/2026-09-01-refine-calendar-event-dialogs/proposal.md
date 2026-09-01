## Why

Calendar dialogs still repeat section labels that add little context, and dated events in the day
dialog use a compact one-off row instead of the shared Employee card pattern. This makes the same
Employee data and actions inconsistent across Calendar surfaces.

## What Changes

- Remove the visible Current and upcoming heading from the dated-tag history dialog while retaining
  ordering, the conditional Past section, and its empty-state behavior.
- Remove the visible Dated tags heading from the Calendar day dialog.
- Render the day dialog's dated events as full shared Employee cards with the ordinary Tag, Edit,
  and Delete actions aligned on the right.
- Group multiple same-day events for one Employee into one card, keep every event label visible,
  and preserve navigation from an event label to its tag history.
- Update browser coverage, documentation, specifications, and the existing Calendar screenshots.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dated-employee-tags`: Calendar day and tag dialogs remove redundant headings while day events use
  complete actionable Employee cards.
- `organization-editor`: Calendar event-detail presentation changes without changing event data or
  navigation.

## Impact

The change affects the Calendar client component, browser tests, two existing Calendar screenshots,
the removal of one obsolete translation key, and related documentation/specifications. It changes
no state contract, persistence behavior, API, MCP behavior, privacy boundary, or Pages/server parity.
