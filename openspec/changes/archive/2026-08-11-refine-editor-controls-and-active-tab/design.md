## Context

The Editor canvas intentionally differs from the white or dark root surface, but its two left-side
control groups currently use transparent wrappers. This makes related actions look detached from
one another. Shared tabs also apply a semibold active state on top of a foreground-color change.

The change is visual only. It does not touch application state, localization messages, file
handling, trust boundaries, or render-heavy canvas data.

## Goals / Non-Goals

**Goals:**

- Give the top-left and bottom-left Editor action groups a compact, clearly bounded surface.
- Preserve the existing control order, hit targets, search expansion, and canvas placement.
- Use one font weight for active and inactive tabs while retaining a clear color-based active state.
- Keep both themes legible and maintain narrow-viewport containment.

**Non-Goals:**

- Adding surfaces around product workflows, header actions, or ordinary lists.
- Changing button styling, Editor behavior, workspace data, or public file contracts.
- Adding shadows, new dependencies, requests, persistence, or localization keys.

## Decisions

1. **Use one shared toolbar-surface class on both Editor groups.** Each wrapper receives an adaptive
   `background` surface, a subtle border, compact padding, and a small radius. The controls remain
   borderless so the wrapper communicates grouping without turning every action into a separate
   tile. A backdrop blur keeps the surface legible while Search expands over canvas content. This is
   preferred over coloring each button because individual fills would still fragment the group.

2. **Keep the island exception local to the canvas.** The canvas is an interactive spatial surface,
   so floating controls need an owned background. Ordinary product tabs remain on the continuous
   root surface and are not affected.

3. **Remove only the active font-weight override from shared tabs.** The existing base `font-medium`
   remains for every trigger, while active state continues to use the foreground token. Applying the
   change in the shared Tabs primitive keeps product and nested tabs consistent.

4. **Assert computed presentation in Playwright.** Browser tests compare active/inactive tab weights
   for equality and verify that both Editor wrappers have the same non-transparent surface, border,
   radius, padding, and placement. Deterministic Editor screenshots cover light and dark rendering.

## Risks / Trade-offs

- **[Risk] The top toolbar can become slightly wider after padding is added.** → Keep padding compact,
  retain its existing viewport max-width, and verify Search expansion remains contained.
- **[Risk] An opaque surface can feel heavy over the canvas.** → Use the existing theme background
  with slight transparency, a subtle border, no shadow, and no per-button fill at rest.
- **[Risk] Color-only tab state could be too subtle.** → Retain the established foreground and
  muted-foreground contrast plus hover, focus, and ARIA selection state.
