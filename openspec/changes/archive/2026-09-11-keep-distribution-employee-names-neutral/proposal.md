## Why

Distribution status currently recolors Employee names green or amber. Names should retain the
normal theme foreground so status is communicated by row highlighting rather than name color.

## What Changes

- Keep Employee names neutral in distribution-enabled Units for both statuses and themes.
- Preserve configured row fills, connection and marker colors, and existing selection feedback.
- Refresh the affected gallery frames and existing browser verification.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editor-distribution-mode`: Status colors do not alter Employee name text.

## Impact

The change affects Editor styling, browser assertions, documentation, and screenshots. There are
no state, export, privacy, dependency, or compatibility changes. Membership, sorting, distribution
eligibility, and localization copy are outside this change.
