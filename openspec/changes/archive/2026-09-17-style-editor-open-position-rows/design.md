## Context

Open positions already share Employee-row ordering, measured heights, virtualization, hit testing,
anchors, and export geometry. Their only persistent visual distinction is a dashed placeholder
avatar. Adding a normal CSS border to the row could reduce the content box and diverge from PNG
geometry, while selection, focus, and drop feedback already use background and ring treatments.

## Goals / Non-Goals

**Goals:**

- Make the entire open-position row recognizable as a vacancy in resting and interactive states.
- Preserve exact row bounds and reproduce the stable presentation in full-View and scoped PNG.
- Keep the implementation constant-cost for virtualized rows.

**Non-Goals:**

- Changing open-position data, Employee styling, row ordering, geometry, interaction behavior,
  localization, or exports other than Editor PNG.
- Adding background tint, animation, remote assets, dependencies, or persistent preferences.

## Decisions

### Render a non-layout DOM overlay

Each open-position container receives one absolutely positioned, pointer-transparent inset outline
layer. It uses the existing six-pixel row radius and a one-pixel dashed border. Because the layer is
outside normal layout, it cannot alter content width, measured height, virtualization offsets,
pointer routing, or anchors. A real row border was rejected because it would consume content-box
space; an avatar-only or side-marker treatment was rejected because it does not identify the full
vacant slot.

The resting and hover outline uses a moderately transparent muted foreground. Selection retains the
existing primary fill and uses a primary-foreground outline; Employee-drop feedback retains the
existing signal ring and uses a signal outline. Focus feedback remains the existing ring. The
placeholder avatar remains unchanged.

### Paint the same stable semantic in PNG

The PNG painter derives an inset stroke path from the existing complete row surface bounds, including
measured Tag height. A shared pure presentation helper supplies the one-logical-pixel width,
six-pixel outer radius, neutral slate color, and deterministic dash pattern. The painter restores
canvas dash state after every row. PNG never renders selection, hover, focus, or drop feedback.

### Verify presentation without adding product state

Browser coverage reads the dedicated outline layer's computed style in both runtimes and verifies
that Employee rows lack it and geometry is unchanged across selection. Painter tests exercise the
pure outline presentation for default and expanded Tag rows. Existing image workflows and gallery
frames provide end-to-end visual evidence without a new screenshot scenario.

## Risks / Trade-offs

- **Theme contrast can make a subtle line hard to see** → use semantic muted/primary/signal colors
  in DOM and a reviewed fixed slate tone in the light PNG palette.
- **Canvas dash state can leak into later drawing** → isolate the outline in `save`/`restore` and
  explicitly use the presentation helper.
- **Decorative chrome could intercept row input** → make the overlay pointer-transparent and
  accessibility-hidden.
- **A one-pixel stroke could extend outside row bounds** → inset the canvas path by half the line
  width so the complete stroke remains inside the shared surface bounds.

## Migration Plan

No State or SQLite migration is required. Rollback removes the decorative overlay, painter stroke,
tests, documentation, and regenerated screenshots.

## Open Questions

None.
