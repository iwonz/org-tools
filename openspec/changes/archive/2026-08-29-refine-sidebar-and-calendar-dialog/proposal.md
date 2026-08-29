## Why

The initial expanded sidebar consumes workspace width before the user asks for it, while its collapse control presents an unnecessarily full-width target. Calendar day dialogs also reserve space for an empty dated-tag section, adding visual noise when the selected day has birthdays only.

## What Changes

- Start the desktop sidebar in compact mode for every application load.
- Keep the sidebar mode transient and user-toggleable without persisting it.
- Render the expanded collapse control as a left-aligned icon-sized button instead of a full-width row.
- Omit the dated-tag section from a calendar day dialog when the selected day has no dated-tag events.
- Let a birthdays-only dialog use the available body width instead of retaining an empty second column.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Change the default desktop sidebar mode and the expanded collapse-control geometry.
- `dated-employee-tags`: Hide the dated-tag section in day dialogs that have no dated-tag events.

## Impact

The change affects the application shell, the Calendar day dialog, interface documentation, browser coverage, and the two capability specifications above. It does not change organization state, import or export formats, browser storage, privacy behavior, dependencies, or remote communication. Mobile rail behavior, navigation order, event data, and tag editing are explicit non-goals.
