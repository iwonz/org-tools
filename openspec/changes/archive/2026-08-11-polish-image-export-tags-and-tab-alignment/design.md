## Context

Employee tags use compact neutral DOM chips, while the canvas PNG renderer still owns older blue
paint values and a smaller, partially duplicated chip geometry. The shared row-height model estimates
packing with different dimensions from the PNG painter, which can reserve space that the painter does
not use. Populated product workflows also keep an eight-pixel outer margin on all sides, while the
Editor canvas starts directly below the application header.

## Goals / Non-Goals

**Goals:**

- Make PNG tag chips visually consistent with the Employee-card tags.
- Make packing, painting, and row-height growth use one compact set of geometry constants.
- Start every product workflow at the same header boundary without removing useful internal spacing.
- Preserve deterministic, locale-aware image generation at current scale limits.

**Non-Goals:**

- Changing Employee tags, dates, sorting, or the public state schema.
- Replacing canvas rendering with DOM capture.
- Reworking tab content below the root inset or changing the Editor canvas background.
- Adding runtime dependencies or remote resources.

## Decisions

### Share export-compatible tag geometry within the PNG pipeline

The PNG export module will expose chip height, horizontal padding, horizontal/vertical gap, and a
deterministic text-width estimate. Its painter and export row-height calculation will consume those
same constants and wrap helper. This keeps export bounds, canvas allocation, and pixels aligned
without requiring DOM measurement during export, while the denser interactive canvas can retain its
own compact geometry.

Measuring the rendered DOM or using `CanvasRenderingContext2D.measureText` only in the exporter was
rejected because it would reintroduce two packing models and could change layout after fonts load.

### Match the neutral card treatment in the light PNG palette

PNG chips will use a translucent slate-neutral fill composited by the canvas and dark slate text,
with the same rounded shape, font size, line height, and horizontal padding as the compact canvas tag
component. The export stays deterministic and independent of the active CSS theme or network fonts.
The localized date remains part of the single chip label after a middle dot.

### Remove only the outer top inset

Populated Teams, Employees, Analytics, and Download wrappers will replace their uniform outer margin
with horizontal and bottom margins. Calendar and Editor already begin at the header boundary. Header
and body padding inside each workflow remains unchanged, so controls retain their intended breathing
room while all tab backgrounds align vertically.

## Risks / Trade-offs

- [Long translated labels can wrap differently than the DOM] -> Keep the existing deterministic
  character-width estimate but use it consistently for both export painting and geometry.
- [Taller chips can enlarge dense exported diagrams] -> Reduce redundant vertical growth by deriving
  each additional row from the exact chip height plus gap rather than an unrelated constant.
- [Spacing changes can affect screenshot baselines] -> Update deterministic screenshots and verify
  populated workflows plus the Org Editor export preview.
