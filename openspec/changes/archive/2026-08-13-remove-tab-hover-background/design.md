## Context

All product and nested tabs share one Radix-based trigger class. Its hover state currently changes
both foreground and background, while the active state already relies on foreground color only.
The requested adjustment is presentation-only and has no state or data flow.

## Goals / Non-Goals

**Goals:**

- Keep tab backgrounds transparent before, during, and after pointer hover.
- Retain foreground-color hover feedback and all focus, active, disabled, and keyboard behavior.
- Apply the behavior consistently to product and nested tabs through the shared primitive.

**Non-Goals:**

- Changing non-tab buttons, menu items, focus rings, tab spacing, or active-tab color.
- Changing application data, public formats, localization, privacy, or dependencies.

## Decisions

1. **Remove only the shared `hover:bg-*` utility.** The existing `hover:text-foreground` utility
   remains, so every tab consumer inherits the same color-only pointer feedback without duplicated
   overrides.
2. **Verify the actual hovered state in Playwright.** Tests hover an inactive product tab and a
   nested Download tab, then assert their computed background remains transparent while foreground
   color changes. Existing keyboard and active-state assertions remain intact.
3. **Regenerate the deterministic gallery.** Pixel changes should be absent at rest, but generation
   confirms the shared primitive did not affect static layout.

## Risks / Trade-offs

- **[Risk] Pointer feedback becomes too subtle.** → Preserve the established muted-to-foreground
  color transition and focus ring.
- **[Risk] A local tab class reintroduces a fill.** → Browser coverage checks representative product
  and nested groups through computed styles.
