## Context

The unified header already places a contiguous product-tab island beside four global controls.
Product tabs currently indicate selection with a pseudo-element underline, while the global
controls mix ghost, outline, and primary button styles with gaps between them. The requested visual
language is two clear groups: navigation on the left and actions on the right.

The header must remain usable at 390, 1024, and 1280 px, retain horizontal tab scrolling, and keep
all Radix tab/select semantics and existing accessible names.

## Goals / Non-Goals

**Goals:**

- Give the selected product tab an unmistakable flat state without an underline or button outline.
- Present language, theme, Import, and Export as equal members of one shared action island.
- Preserve responsive containment, keyboard behavior, tooltips, menus, and transfer workflows.
- Keep both islands legible in light and dark themes.

**Non-Goals:**

- Changing tab order, action behavior, localization, data contracts, or shell dimensions.
- Applying this top-level treatment to nested tabs or unrelated button groups.
- Introducing dependencies, storage, requests, or data-model changes.

## Decisions

### Use a flat filled segment for the active product tab

The active trigger uses the existing semantic accent surface and accent foreground. It keeps square
internal edges, no individual border, and no pseudo-element. This gives selection enough area to be
clear while the shared outer border continues to define the navigation group.

An inset underline was rejected because the requested state must not use an underline. A primary
button fill was rejected because it would make a tab read as a call to action.

### Give global controls one shared outer boundary

The action wrapper owns the height, background, radius, overflow clipping, and one border. Each
child trigger uses the same transparent, square, borderless style and applies only hover, focus, or
open-state feedback. Language and theme remain square; Import and Export expand for labels at large
widths. This preserves the existing responsive footprint and presents one action family.

Individual dividers are omitted so the island remains consistent with the interface policy against
decorative rules. Focus rings remain inset and each control retains its own accessible name.

### Keep trigger styling injectable

Language and theme controls accept an optional trigger class supplied by the header. Their default
appearance remains available if either component is reused outside the action island.

## Risks / Trade-offs

- [Adjacent actions could be harder to distinguish without gaps] -> Preserve icon/text identity,
  equal height, hover/focus feedback, and adequate horizontal padding.
- [The selected tab fill could resemble a button] -> Keep internal edges square, remove its own
  border and radius, and use a subdued semantic accent instead of the primary action color.
- [Focus rings could be clipped by the shared wrapper] -> Use inset focus rings on each child.
