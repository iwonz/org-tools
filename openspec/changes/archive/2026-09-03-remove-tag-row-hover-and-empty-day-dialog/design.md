## Context

The Tag catalog already renders explicit Eye, Color, Edit, and Delete controls, so the surrounding
row does not need a hover affordance or card-like inset. Calendar currently renders every in-month
date as a button and opens a day dialog even when its derived birthday and dated-Tag collections are
empty.

## Goals / Non-Goals

**Goals:**

- Make Tag catalog rows content-aligned, padding-free, and visually inert outside their actions.
- Prevent empty Calendar dates from presenting or activating a day-detail affordance.
- Preserve accessibility, current-day/weekend styling, populated-day interactions, and large-list behavior.

**Non-Goals:**

- No state, database, API, import/export, tag-assignment, or calendar-event model changes.
- No new dependencies or translations.
- No change to the contents or actions of populated day dialogs.

## Decisions

- Remove row-level padding and hover background from the Tag catalog wrapper while retaining the
  existing fixed action area and list gap. This avoids a false card affordance without changing
  individual button feedback.
- Derive `hasEvents` from the existing birthday and dated-Tag collections for each Calendar date.
  Populated dates remain native buttons; empty dates render as non-interactive cells with the same
  date-number geometry and semantic weekend/current styling.
- Keep event derivation in the existing Calendar model path and add browser assertions, avoiding a
  second event index or per-pointer computation.

## Risks / Trade-offs

- **Risk: empty and populated cells drift geometrically** → share the same cell layout classes and
  vary only the interactive element/affordance classes.
- **Risk: Tag row actions lose usable hit areas** → remove only wrapper padding; preserve each action
  button's own target size and focus feedback.
- **Risk: screenshots become stale** → regenerate and inspect the complete deterministic gallery.
