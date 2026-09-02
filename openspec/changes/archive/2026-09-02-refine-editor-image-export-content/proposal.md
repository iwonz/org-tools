## Why

Org Editor PNG exports currently ellipsize an Employee tag when one chip is wider than the available
text column, so the downloaded image loses organization information. The image also exposes a Live
badge for dynamic Units even though membership mode is implementation detail rather than useful
chart content.

## What Changes

- Render every Employee tag label and optional localized date in full in Org Editor PNG previews,
  clipboard copies, and downloads.
- Wrap an oversized tag inside its chip and grow the Employee row and Unit card deterministically,
  preserving following rows, bounds, and hierarchy connections without ellipsis or overflow.
- Omit both Static and Live membership-type labels from exported Unit cards while retaining Unit
  identity and Employee-count summary.
- Add unit and browser coverage with a deliberately oversized tag, refresh documentation, and
  regenerate the maintained screenshot gallery.
- Keep the live Editor canvas, `OrgToolsState`, Import/Export state, templates, Data Download,
  SQLite, APIs, and MCP unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Image exports preserve complete tag content through chip-internal wrapping
  and omit Unit membership-type labels.

## Impact

The change affects only the local Org Editor canvas-image layout and painter, its callers, tests,
documentation, capability spec, and generated screenshots. It introduces no dependency, network
request, persistent field, compatibility path, migration, or external API.
