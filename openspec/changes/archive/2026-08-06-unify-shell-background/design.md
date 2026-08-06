## Context

The root application, unified header, and most top-level surfaces currently use `background`, which
is also the opaque surface token for dialogs and controls. In the light theme that token is pure
white, so the header remains a prominent white strip even though it has no border or shadow. Some
product tabs also repeat `bg-background` on their root and header containers, which makes a future
shell-level treatment inconsistent.

The change is visual only. It must retain the static browser-only architecture, existing theme and
locale behavior, responsive header containment, accessible control boundaries, and current state
contracts.

## Goals / Non-Goals

**Goals:**

- Render the root shell, unified header, and all six top-level product surfaces on one continuous
  theme-aware neutral background.
- Preserve opaque surface backgrounds for cards, fields, dialogs, popovers, calendar cells, and
  other controls whose boundary communicates interaction or grouping.
- Keep the header borderless and shadowless in both themes.
- Make the shell treatment explicit and reusable rather than overloading the general background
  token.

**Non-Goals:**

- Redesign cards, inputs, dialogs, navigation controls, density, typography, or theme switching.
- Change public state, import, export, persistence, localization, or application behavior.
- Introduce gradients, decorative rules, or new runtime dependencies.

## Decisions

### Add a dedicated shell color token

Add `--shell` to the light and dark theme variables and expose it as Tailwind's `shell` color. Use a
very light, low-chroma neutral in the light theme and a single neutral dark value in the dark theme.
Keeping `background` unchanged preserves white/light opaque surfaces and avoids unintentionally
recoloring dialogs, inputs, popovers, and existing component primitives.

Changing `background` globally was rejected because it would flatten or recolor every control and
modal rather than only the application workspace.

### Apply the token only at top-level layout boundaries

The root app owns `bg-shell`. The header is transparent, and each top-level tab root and product
header either inherits the shell or uses `bg-shell` explicitly where a portal or nested layout
boundary requires it. Nested cards and meaningful interactive surfaces keep their current
`background`, `card`, or `popover` tokens.

Inheritance alone was rejected for every descendant because several tab roots explicitly declare
`bg-background`; leaving those declarations would create visible white blocks below the header.

### Verify continuity through stable browser hooks

Browser tests use existing `data-demo-id` hooks for the app header and representative product
headers, plus tab-content roots, to assert that their computed background is transparent or the
same shell color. Screenshots cover light and dark themes and retain the existing responsive header
checks at 390, 1024, and 1280 px.

No organization data enters the styling path, no new request is made, and no state migration or
failure-atomicity behavior is involved.

## Risks / Trade-offs

- [The neutral background could reduce contrast for muted navigation] → Keep active tabs and
  bounded controls on their existing opaque tokens and verify light/dark screenshots manually.
- [A missed top-level `bg-background` could leave a white island] → Audit all six tab roots and
  surface headers and add computed-style browser coverage for representative surfaces.
- [Changing reusable primitives could affect dialogs] → Do not change shared dialog, popover,
  field, card, or button background classes.
