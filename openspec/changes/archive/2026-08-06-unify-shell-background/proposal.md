## Why

The unified header still reads as a separate white strip in the light theme because the shell uses
the same pure-white surface token as dialogs and controls. A dedicated neutral shell background
will make the header and product surfaces feel like one continuous workspace while preserving
contrast for meaningful interactive surfaces.

## What Changes

- Add a theme-aware shell background token with a soft neutral light value and a unified dark
  value.
- Make the application header transparent and let it inherit the shell background.
- Use the shell background for all six top-level product surfaces and their surface headers.
- Keep dialogs, popovers, fields, cards, calendar cells, and other bounded controls on their
  existing surface tokens.
- Keep the shell borderless, without a header shadow, rule, or other separator.
- Update visual documentation and deterministic screenshots for the continuous shell.
- Preserve all state, import, export, localization, privacy, and responsive behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Require one continuous theme-aware background across the application shell,
  header, and top-level product surfaces.

## Impact

The change affects the shared theme tokens, the application shell, top-level product surface
containers, interface-chrome requirements, usage and screenshot documentation, browser assertions,
and deterministic screenshots. It adds no dependency, changes no public data contract, makes no
network request, and does not alter organization-data persistence.
