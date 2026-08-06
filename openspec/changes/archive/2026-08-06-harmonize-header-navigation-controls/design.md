## Context

The unified header uses the shared Tabs primitive for product navigation. Its default list style
creates one muted segmented container with adjacent triggers, while locale, theme, Import, and
Export render as separate controls with responsive gaps. Changing the shared Tabs primitive would
also restyle unrelated tabs inside Download and dialogs.

This is a presentation-only change. The 56 px header, product order, Radix keyboard semantics,
responsive overflow, theme behavior, and static browser-only architecture must remain intact.

## Goals / Non-Goals

**Goals:**

- Give every product tab an individual, consistent control boundary.
- Match the product-tab gap to the right-side action gap at narrow and wider breakpoints.
- Keep active, hover, and focus states clear in light and dark themes.
- Preserve horizontal containment and keyboard navigation.

**Non-Goals:**

- Restyle nested Tabs instances, rename or reorder product surfaces, or change header actions.
- Change application state, data contracts, persistence, localization, or privacy behavior.
- Add dependencies or reusable styling variants beyond the header-specific treatment.

## Decisions

### Scope styling to the product navigation instance

Override the product `TabsList` with a transparent, padding-free list and responsive `gap-1
sm:gap-2`, matching the existing global-action group. Apply one shared header-tab class string to
all six `TabsTrigger` instances. The shared Tabs primitive retains its current segmented treatment
for internal workflows.

Changing the primitive globally was rejected because Download source tabs and other local tab sets
have different grouping needs.

### Use outline controls with a filled active state

Every product tab uses the same 36 px height, radius, input-colored border, background surface,
padding, typography, and icon sizing as header buttons. Inactive tabs resemble outline actions;
the active tab uses the primary foreground/background pair so selection remains unambiguous in both
themes. Existing Radix attributes continue to drive selection and accessibility.

Leaving inactive items borderless was rejected because spacing alone does not establish the
consistent button-like rhythm requested for the header.

### Verify geometry and behavior in browser tests

Use existing product navigation hooks to assert equal inter-item gaps, individual borders, equal
heights, and consistent radii. Retain the existing 390, 1024, and 1280 px containment checks and
keyboard traversal. Regenerated light and dark screenshots provide visual review.

No organization data enters the styling path, and no network, validation, mutation, or rollback
behavior changes.

## Risks / Trade-offs

- [Individual borders increase navigation width] → Keep horizontal scrolling inside the existing
  navigation region and test all supported header widths.
- [Filled selection could compete with Export] → Use the same restrained theme tokens and verify
  the full header visually in light and dark modes.
- [Overrides could leak into local tabs] → Apply classes only in the application header and leave
  the shared Tabs primitive unchanged.
