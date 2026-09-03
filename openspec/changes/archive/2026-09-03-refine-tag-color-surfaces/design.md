## Context

The Tag palette is already normalized in the global catalog and propagated to rendered assignments,
but the presentation helper currently returns a solid dot color. Four consumers then place that dot
before otherwise neutral Tag text. The same visual concept appears in dense Employee chips, quick
assignment rows, the catalog, and the Calendar rail.

## Goals / Non-Goals

**Goals:**

- Make the configured color the tonal fill of the Tag surface itself.
- Remove redundant leading dots while keeping text, dates, counts, and actions readable.
- Centralize light/dark palette classes so every Tag consumer uses identical semantics.
- Preserve geometry, virtualization, interaction, accessibility, and the existing state model.

**Non-Goals:**

- Changing the Tag palette, stored color values, or Tag CRUD behavior.
- Adding per-assignment colors, new borders, shadows, animation, or remote assets.
- Changing output formats or image-export styling.

## Decisions

- Replace the dot-oriented helper with a shared surface helper that returns a restrained background
  and foreground pair for every catalog color. A null color returns the existing neutral Tag style.
  Static class mappings keep Tailwind generation deterministic and avoid runtime style construction.
- Apply the helper directly to compact Tag chips and Calendar Tag buttons. In list rows with actions,
  tint only the Tag identity capsule rather than the whole operational row so action contrast and
  hover behavior remain stable.
- Render palette choices as filled text capsules. This demonstrates the actual Tag appearance and
  removes the final decorative color-dot pattern.
- Keep opacity and foreground combinations explicit for light and dark themes. Color is supportive,
  not the sole carrier of identity: every surface retains its textual label.

## Risks / Trade-offs

- [Risk] Some saturated hues can reduce text contrast in one theme. → Use low-opacity fills with
  darker light-theme and lighter dark-theme foregrounds, then cover computed presentation in browser
  screenshots.
- [Risk] A fill can be overridden by generic Button variants or hover styles. → Put the shared color
  classes after variant classes and add browser assertions for the rendered background.
- [Risk] Removing dots may slightly change compact width. → Keep chip padding unchanged where useful
  and validate dense Employee/Calendar screenshots at maintained widths.
