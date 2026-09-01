## Context

The Calendar tag-history dialog already uses the shared virtualized `EmployeeCardList`, but retains
a redundant heading above its current/future group. The day dialog conditionally renders Birthday
cards and dated events, yet the dated side uses a bespoke compact button with only an avatar, event
label, and name. That one-off row omits the ordinary Employee identity, Unit context, tags, and
right-aligned actions.

## Goals / Non-Goals

**Goals:**

- Remove the two requested visible headings without leaving blank spacing.
- Reuse the existing full Employee card and action composition for dated events in day details.
- Preserve every same-day event label and navigation from a label to its tag-history dialog.
- Keep Birthday rendering, date ordering, conditional sections, virtualization, and localization
  unchanged.

**Non-Goals:**

- Changing Calendar cells, tag-cloud grouping, event dates, persistence, or the state format.
- Removing the Past heading, Birthday heading, event empty states, or tag-history navigation.
- Adding dependencies, remote assets, new catalog entries, or server-only behavior.

## Decisions

### Group day events by Employee before rendering

The day dialog will derive a stable ordered list that groups its `DatedTagEvent` values by Employee
ID. `EmployeeCardList` receives each Employee once, avoiding duplicate virtualized keys when one
person has multiple dated labels on the same day. The card subtitle retains the shared
`EmployeeIdentity` and renders every grouped event label beneath it.

### Keep event labels as explicit navigation controls

Each label becomes a compact, keyboard-accessible button inside the card subtitle. Activating it
opens the same normalized tag-history dialog as the previous whole-row action. Employee profile,
Unit, tag editing, profile editing, and deletion remain independent controls.

### Reuse the existing action callback

Day dated-event cards receive the same `EmployeeCardActions` configuration already used by Birthday
and tag-history cards. This preserves the Tag, Edit, and Delete behavior, stable test markers, and
right-side layout without duplicating mutation logic.

### Remove only visible redundant headings

The Current and upcoming and Dated tags heading elements are removed rather than visually hidden.
Section ownership and data markers remain for layout and testing. Past and Birthday headings remain
because they distinguish meaningful adjacent groups. When a tag has only past events, its retained
current-period empty message uses an automatic-height row and Past receives the remaining space.

## Risks / Trade-offs

- [Multiple events for one Employee could be lost by deduplication] -> Store the complete event
  array per Employee and assert every label remains visible and navigable.
- [Nested controls could conflict with a clickable card] -> Keep the shared card itself
  non-interactive and make only each event label an explicit button.
- [Removing headings could leave uneven spacing in a two-column day dialog] -> Remove heading gaps
  from the dated section and let its card list begin at the section edge without a placeholder.
