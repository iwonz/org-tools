## Context

The header and switchers now use shared islands, while populated product surfaces still place their
headers, searches, and content directly on the shell. Analytics has six useful group surfaces but
uses 40 px horizontal and 32 px vertical gaps. Org Editor renders the View toolbar in a separate
top-left floating card, each top-right control as its own outlined button, and each viewport control
as a separate bottom-left button. Search currently places its field before its trigger, so it reveals
to the left.

The change must preserve top-level empty states, Editor canvas pointer behavior, View management,
responsive containment, virtualization, localization, and the maintained large-workspace target.

## Goals / Non-Goals

**Goals:**

- Give each populated Employees, Teams, Analytics, and Download workflow one owned card surface.
- Keep internal hierarchy readable without adding separators or shadows.
- Reduce Analytics group spacing while retaining its subtle group backgrounds and row capacity.
- Consolidate Editor controls into one top-right and one bottom-left island.
- Move View management to the top-right island and make the final Search control reveal rightward.

**Non-Goals:**

- Changing empty-state layout, canvas commands, View behavior, search results, or data workflows.
- Adding mobile-specific product layouts, new colors, dependencies, storage, or network activity.
- Changing public state, import/export formats, or user data.

## Decisions

### Introduce one reusable product-surface island

A small `ProductSurfaceIsland` primitive owns `rounded-lg`, `bg-card`, minimum-size containment, and
overflow clipping. Each populated product view keeps a transparent top-level section with 8 px shell
inset and places all of its header and content inside this primitive. Empty states remain directly on
the shell.

Using repeated class strings was rejected because the requirement is intentionally shared across
four product surfaces and future visual changes should remain synchronized.

### Keep Analytics groups as nested quiet surfaces

The Analytics outer island uses the card surface. Individual groups use a low-contrast muted
background without borders or shadows so the six datasets remain scannable. The grid uses 12 px in
both directions instead of the current 40/32 px gaps. Group height and virtualized row capacity stay
unchanged.

### Flatten Editor controls inside owned islands

The top-right wrapper owns one boundary and background. `OrgViewToolbar`, layout direction,
arrange/collapse, and Search remove their individual borders, radii, backgrounds, and shadows. The
bottom-left wrapper applies the same rule to zoom, reset, and focus. Focus rings remain inset and all
buttons keep their accessible names.

The View selector stays fixed-width and truncates long names. Moving the complete View toolbar into
the right-aligned wrapper preserves undo/redo and View create/rename/delete behavior.

### Put the Search trigger before its expanding field

Search becomes the last top-island child. Its toggle renders first, followed by the animated
zero-to-288 px field. Because the island remains right-anchored, the island can grow leftward while
the field visibly occupies the space to the right of its trigger. Results remain aligned to the
field's right edge and inside the viewport.

### Tighten the Teams seam through padding

The Teams grid remains gapless and retains its current responsive column calculation. Tree and
Employee pane padding drops from 12 px to 8 px near their shared seam; no rule, shadow, or artificial
gutter is introduced.

## Risks / Trade-offs

- [A single large surface could look visually heavy] -> Keep only one quiet background, no border
  lattice or shadow, and retain shell inset around the surface.
- [Editor search expansion could overflow] -> Keep the group right-anchored, cap the input at 288 px,
  and retain viewport-bounded results.
- [Flattened Editor controls could be hard to distinguish] -> Preserve icons, tooltips, hover/open
  fills, semantic grouping, and inset focus rings.
- [Reduced Analytics gaps could feel crowded] -> Retain 12 px gaps and 12 px group padding.
