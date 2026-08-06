## Context

The product navigation currently overrides the shared Tabs primitive with a gap and an individual
border and surface for each trigger. The selected trigger uses the primary filled-button treatment.
This is visually clear but communicates a toolbar of actions rather than one tab set.

The change is presentation-only. It must preserve the 56 px header, continuous shell background,
product order, Radix semantics, keyboard behavior, horizontal overflow, and right-side actions.

## Goals / Non-Goals

**Goals:**

- Present product navigation as one continuous bounded island.
- Remove spacing and individual button boundaries between triggers.
- Communicate selection with a tab-specific indicator rather than an action-button fill.
- Preserve accessible hover, focus, selection, and responsive overflow behavior.

**Non-Goals:**

- Change nested Tabs instances, header actions, product names, ordering, or density.
- Change state, public formats, persistence, localization, or privacy behavior.
- Add dependencies or animation.

## Decisions

### Move the boundary to the Tabs list

The product `TabsList` owns one input-colored border, one rounded outer shape, a subtle background,
no internal padding, and zero gap. Triggers are adjacent, borderless, square-edged children inside
that boundary. Only the header instance is overridden; the shared Tabs primitive remains unchanged.

Keeping individual trigger borders was rejected because it continues to read as a group of buttons.
Adding separators between triggers was also rejected because the icon and label rhythm is sufficient
inside the single boundary.

### Use an inset bottom marker for selection

Each trigger is positioned relatively. The active trigger keeps a transparent background, stronger
foreground and font weight, and draws a two-pixel primary marker inset from its left and right edges
at the bottom of the island. Hover uses only a low-contrast background; focus retains the existing
ring. This distinguishes selection without turning the active tab into a filled action.

A pill background was rejected because it recreates the button-like treatment. A full-width bottom
border was rejected because adjacent indicators and the outer border would visually collide.

### Test semantics and visual geometry

Browser coverage asserts one list border, zero gap, no trigger borders, transparent active
background, a visible active pseudo-element marker, common trigger height, keyboard traversal, and
containment at 390, 1024, and 1280 px. Regenerated light and dark screenshots provide visual review.

No data, request, validation, mutation, or rollback path changes.

## Risks / Trade-offs

- [The underline could be too subtle] → Pair it with stronger active text and verify both themes.
- [The pseudo-element could overlap the outer border] → Inset it one pixel above the bottom edge.
- [The contiguous island is still wide on mobile] → Retain the existing horizontally scrollable
  navigation viewport.
