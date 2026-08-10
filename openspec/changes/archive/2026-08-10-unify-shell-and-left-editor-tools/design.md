## Context

The app shell and unified header already use the `shell` token, while the shared populated-workflow
wrapper adds a `card` fill inside an eight-pixel inset. That contrast makes each workflow read as a
separate page below the header. The Org Editor's combined action island is anchored with `right-3`,
while canvas content and viewport controls originate on the left.

## Goals / Non-Goals

**Goals:**

- Let the shell token remain visible continuously behind the header and top-level workflow layout.
- Keep the existing workflow containment, rounded clipping, scrolling, and meaningful inner
  surfaces.
- Anchor the populated Editor action island twelve pixels from the canvas's left edge.
- Keep Search last and make its animated field occupy space to the trigger's right.
- Preserve responsive containment, keyboard behavior, localization, and contrast in both themes.

**Non-Goals:**

- Redesigning tabs, controls, cards, Analytics groups, calendar cells, or dialogs.
- Moving the bottom-left viewport island.
- Changing organization data, state transfer, persistence, imports, exports, or networking.

## Decisions

1. **Make the shared product-surface wrapper transparent.** `ProductSurfaceIsland` will keep
   `overflow-hidden`, rounded clipping, and layout containment but drop its `bg-card` fill. Its
   children inherit the shell visually, while actual Employee/Team cards, fields, nested Analytics
   groups, dialogs, and controls retain their existing owned surfaces. Changing the global `card`
   token was rejected because it would erase meaningful contrast across dialogs and cards.
2. **Keep the existing shell token.** The neutral light and dark shell colors remain unchanged, so
   the result is continuity rather than a palette change. The header remains transparent and no
   divider, shadow, or replacement background is introduced.
3. **Left-anchor the complete Editor action island.** Replace the top island's right inset with a
   left inset and start alignment. The View toolbar stays first, Search stays last, and the island
   grows toward the right when Search opens. The bottom-left viewport island is unchanged.
4. **Test geometry and computed backgrounds.** Browser assertions will compare the header,
   top-level content container, and product wrapper backgrounds, then verify the Editor island's
   twelve-pixel left inset and the Search field's rightward placement.

## Risks / Trade-offs

- **Lower outer-workflow contrast** → Preserve the inset, rounded clipping, controls, cards, nested
  groups, and focus states; inspect light and dark screenshots for hierarchy.
- **Wide Russian Editor controls can approach the right edge** → Keep the existing max-width bound
  and right-opening Search animation; browser-test the populated desktop viewport and narrow shell
  overflow.
- **Transparent wrapper can expose an unexpected descendant background** → Assert the wrapper is
  transparent while retaining explicit surfaces only on meaningful descendants.
