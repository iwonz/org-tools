## Context

An unselected Org Editor Unit has a `bg-card` resting surface but currently applies an accent fill
to the whole card on pointer hover. The change makes passive hover visually stable while preserving
the existing selected, connection-drop, Employee-drop, focus, and explicit action-control states.
The same shared Editor component serves the local SQLite and browser-only Pages runtimes.

## Goals / Non-Goals

**Goals:**

- Keep the computed Unit-card background color and opacity identical before and during passive
  pointer hover in both themes.
- Preserve Unit geometry, selection, drag/drop, keyboard access, and contextual controls.
- Protect the behavior with production-browser assertions and keep the documented visual contract
  current.

**Non-Goals:**

- Redesign toolbar, context-menu, Employee-row, selection, drag/drop, or focus feedback.
- Change the public state contract, persistence, MCP, Import/Export, or runtime boundaries.
- Add a design token, dependency, schema, compatibility path, or network behavior.

## Decisions

Remove the hover background utility only from the outer Unit-card class. The existing `bg-card`
base remains the sole passive surface; selected and drop-target classes continue to override it for
explicit state. This is narrower and less error-prone than introducing another hover token or
imperative pointer state.

Keep `group-hover` visibility for the connection handle and existing feedback on controls inside a
Unit. Those are explicit available actions and do not alter or fade the Unit surface itself.

The browser regression records the card's computed background color and opacity at rest, hovers the
same Unit, and requires exact equality plus unchanged geometry in light and dark themes. Computed
style assertions verify the rendered contract independently of Tailwind class spelling.

## Risks / Trade-offs

- [A Unit can feel less hover-reactive] → Retain the pointer cursor, visible connection handle,
  selectable content, and explicit control feedback without repainting the complete card.
- [A broad selector could accidentally test a selected or drop-target Unit] → Use the maintained
  unselected demo Unit and assert its selection state and computed presentation directly.
- [Theme tokens can differ] → Compare each theme's hover presentation to its own resting
  presentation instead of hard-coding color values.
