## Context

Editor Unit rows use one shared height/prefix-offset layout for virtualization, hit testing, external
anchors, Unit sizing, hierarchy placement, and DOM rendering. PNG export currently rebuilds the same
prefix offsets from measured tag-aware row heights. Both stacks place rows contiguously, so adding a
CSS-only margin would desynchronize virtualized rows, attachments, drop targets, Unit bounds, and
exported images.

The change is presentation-only and must preserve the strict State shape, View history, selection,
row ordering, Employee counts, collapse behavior, and the 20,000-Employee/4,000-Unit target.

## Goals / Non-Goals

**Goals:**

- Render one compact 4 logical px interval between every adjacent visible Unit row.
- Keep the first row at offset zero and add no trailing interval after the final row.
- Use one pure offset calculation in DOM geometry and PNG export.
- Preserve variable tag-driven row heights, virtualization, hit testing, attachments, open-position
  styling, distribution mode, and hierarchy layout.

**Non-Goals:**

- Changing row content padding, font, avatar, Tag, selection, or vacancy presentation.
- Adding spacing outside the row stack or altering the Unit header/footer padding.
- Changing State, persistence, history, localization, or any data export.

## Decisions

### Treat spacing as stack geometry, not element margin

Add `ORG_EDITOR_EMPLOYEE_ROW_GAP = 4` and a pure row-stack helper that returns offsets and total
height from tag-aware row heights. Offset zero belongs to the first row; the gap is inserted only
before indexes greater than zero, so `n` rows contribute exactly `max(0, n - 1) * 4` extra height.

The DOM non-virtual list uses the same gap value in its grid, while virtual rows keep absolute tops
from the shared offsets. Unit height, spatial bounds, row hit testing, anchor lookup, and hierarchy
placement consume those offsets and total height. This avoids layout measurements and keeps work
linear only when the already-required row layout is rebuilt.

Alternative: top/bottom margins on every mounted row. Rejected because margins collapse
differently, do not describe virtualized offscreen rows, and would leave canvas geometry stale.

### Reuse shared offsets in PNG planning

PNG tag measurement continues to determine each row's content height, then calls the same pure
row-stack helper. Row fills, vacancy outlines, glyphs, anchors, Unit height, and footer placement all
therefore shift together. There is no transparent padding inside row surfaces and no transient
selection chrome in PNG.

Alternative: duplicate `index * gap` arithmetic in the painter. Rejected because it invites DOM/PNG
drift and complicates variable-height coverage.

### Space the complete discriminated row list

Employee and open-position rows share sorting, virtualization, anchors, and PNG geometry, so the
interval applies between every adjacent visible row regardless of type. A collapsed Unit with one
boss has no interval, and hidden open positions contribute no space.

## Risks / Trade-offs

- **Existing Unit heights increase for multi-row rosters** → use the same derived total everywhere,
  then verify hierarchy connections, footer placement, row anchors, and scoped PNG.
- **A virtual boundary can land inside the gap** → binary search advances to the next row, while
  overscan keeps both neighboring rows safely mounted.
- **Gallery output changes across many Editor frames** → keep the 59-scenario catalog, inspect every
  regenerated PNG, and require identical hashes from two consecutive runs.

## Migration Plan

No migration is required because the change is fully derived presentation geometry. Rollback is a
code rollback with no State or SQLite conversion.

## Open Questions

None.
