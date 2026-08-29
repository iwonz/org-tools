## Context

The application shell currently initializes its local sidebar state as expanded. The same React state controls desktop width, label visibility, tooltip exposure, and toggle direction without entering persisted workspace state. The Calendar day dialog always renders a two-column body with both birthday and dated-tag sections, even when the selected day's derived event list is empty.

## Goals / Non-Goals

**Goals:**

- Make the transient sidebar state compact on initial render.
- Preserve the existing manual expand and collapse interaction, responsive rail, icon axis, and width transition.
- Reduce the expanded collapse control to the smallest existing accessible button footprint while keeping it left aligned.
- Render the dated-tag day section only when derived events exist.
- Keep the birthdays section usable at full dialog-body width when the dated-tag section is absent.

**Non-Goals:**

- Persisting sidebar state in browser or workspace data.
- Changing mobile rail behavior, navigation order, tag data, event indexing, or dialogs opened from the dated-tag cloud.
- Adding dependencies, network requests, or format migrations.

## Decisions

1. Initialize the existing component-local boolean to compact. This keeps the data flow and trust boundary unchanged: sidebar mode remains ephemeral React state and never reaches MobX, storage, import, or export.
2. Use the existing 40 px button height as a 40 px width in both desktop modes. Center the chevron with equal inline space and offset the square so the centered chevron remains on the navigation icon axis while the expanded hit area does not span the panel.
3. Derive day-dialog layout directly from `dialogDay.events.length`. The event index is already available and bounded to the selected day, so no new state, scan, or performance cost is introduced.
4. Conditionally omit the complete dated-tag section instead of rendering an empty message. Birthday rendering and dialog close behavior remain unchanged.

## Risks / Trade-offs

- [A compact default hides labels from first-time users] → Existing localized accessible names, native titles, and tooltips remain available, and the visible toggle expands the panel.
- [A smaller toggle target is less forgiving than a full-width row] → The target remains the existing 40 by 40 px shared control size and keeps keyboard focus behavior.
- [Conditional layout can leave stale content while closing] → Rendering follows the current `dialogDay` value, which is cleared only through the existing dialog close callback.

## Migration Plan

Ship the source, specification, documentation, and browser expectation changes together. No data migration is required. Rollback restores the prior local-state initializer, button width class, and unconditional dialog section.

## Open Questions

None.
