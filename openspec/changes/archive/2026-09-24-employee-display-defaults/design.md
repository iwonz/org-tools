## Context

`createDefaultEmployeeDisplayFormats` and `DEFAULT_EMPLOYEE_DISPLAY_LINE_GAPS` are the single sources used by blank State creation, initial store values, and format Reset actions. The maintained synthetic fixture repeats these values so browser tests and screenshots show the default product experience.

The State contract already accepts arbitrary format strings and integer gaps from 0 through 24. Changing constants therefore changes initial values without changing the contract or requiring compatibility code.

## Goals / Non-Goals

**Goals:**

- Use `**{fullName}** {positions} {tags}` for new and reset Employees and Units formats.
- Use 5 pixels as the initial gap in all four display contexts.
- Keep code, fixtures, tests, documentation, and screenshots aligned with the maintained defaults.

**Non-Goals:**

- Rewriting any existing saved organization's formats or gaps.
- Resetting a line gap when the user resets only a format.
- Changing Editor or Editor-export format strings, State validation, or rendering behavior.

## Decisions

The default factory and shared gap constant remain authoritative. Blank State and stores continue to clone those values, and Reset continues to request the current-locale format from the factory. The synthetic fixture is updated explicitly because it is a maintained example rather than a migration target.

Tests will assert literal Employees and Units defaults as well as the exported blank State, ensuring the one-line Markdown and semantic token spacing do not regress. Existing custom State round trips remain unchanged.

## Risks / Trade-offs

- **A test may confuse maintained defaults with compatibility behavior.** → Keep import and parser tests accepting any valid saved values and limit new assertions to blank creation, reset, and the maintained fixture.
- **The single-line default can wrap on narrow cards.** → The existing shared measured layout continues to wrap text and semantic surfaces without changing their styling.

## Migration Plan

No migration is required. Existing SQLite and imported State retain their saved values. Rollback restores the previous constants and fixture values without transforming data.

## Open Questions

None.
