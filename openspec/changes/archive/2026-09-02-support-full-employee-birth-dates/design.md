## Context

Org Tools currently stores Employee birthdays as nullable `MM-DD` strings. The same value is validated by the strict state parser and mapped Employee Import, indexed by Calendar and Analytics, rendered by the Employee form, and emitted by structured exports. The change is therefore a breaking public-state change across both runtimes even though birthday is not part of deterministic Employee identity.

The product intentionally has no state version, migration framework, or compatibility readers. Server mode must keep its current local data usable through a one-time controlled rewrite of the ignored SQLite row while the runtime is stopped; future startup accepts only the resulting current schema. Pages begins from blank live-tab memory or a current Import and needs no persisted migration.

## Goals / Non-Goals

**Goals:**

- Persist one unambiguous nullable `DD.MM.YYYY` birthday value.
- Represent an unknown year explicitly as `1900` while retaining the known day and month.
- Let create and edit workflows select a valid day, month, and year through the existing styled Select primitive.
- Preserve recurring Calendar and Analytics behavior, including leap-day projection.
- Enforce the same validation in manual editing, Employee Import, complete-state Import, SQLite reads, exports, fixtures, and tests.
- Keep validation and import replacement atomic and localized.

**Non-Goals:**

- No compatibility parsing for `MM-DD`, ISO dates, timestamps, locale-dependent free text, or partial dates.
- No age calculation, birthday-year disclosure policy, date-picker dependency, schema version, or runtime migration.
- No change to Employee ID derivation, dated Employee tag dates, Unit data, persistence boundaries, or screenshot scenario count.

## Decisions

### Persist a strict display-order date string

`birthday` remains a nullable scalar but its only accepted non-null shape becomes `DD.MM.YYYY`. A shared parser validates the exact width, separators, year range, and calendar date; a shared formatter constructs the canonical zero-padded string. This matches the requested interchange format and avoids timezone conversion. ISO `YYYY-MM-DD` was rejected because it would not satisfy the explicit import contract and would require separate presentation conversion everywhere.

### Reserve 1900 as semantic unknown-year data

Year `1900` never represents a known birth year. The parser returns `{ day, month, year, yearKnown }`, where `yearKnown` is false exactly for 1900. Validation for this sentinel uses leap-capable reference year 2000, allowing `29.02.1900` to mean an unknown-year February 29 birthday even though calendar year 1900 itself was not leap. Known years validate against their actual Gregorian calendar.

Known years range from 1901 through the current UTC year in the Employee selector and validator; future dates and earlier numeric years are invalid. This keeps the form and import contract aligned. The current year is evaluated when validation or the dialog option list is built rather than persisted as metadata.

### Use three coordinated styled Select controls

The Employee dialog owns Day, Month, and Year draft values. A completely absent selection persists `null`; a partially selected birthday blocks submission with localized feedback. Year offers an explicit Unknown year option backed by `1900`, followed by current-to-1901 values. Day options are bounded by the selected month and semantic year; changing month or year clears an impossible selected day. The three controls use existing Radix-based Select surfaces and accessible localized labels.

A single native date input was rejected because it cannot represent an unknown year, renders inconsistently across browsers, and would obscure the sentinel contract.

### Derive recurrence keys without discarding the year

Calendar, birthday filters, search indexes, and Analytics parse the complete value and derive their existing `MM-DD` recurrence key internally. Exports return the original canonical `DD.MM.YYYY` scalar. This preserves O(n) index construction and avoids duplicating birthday state.

### Keep Import and SQLite replacement atomic

Mapped Employee Import normalizes each selected birthday and reports a row-localized format error before building an apply candidate. Complete-state Import validates every Employee with the production parser before replacement. Neither path mutates current memory on failure.

The local SQLite conversion is an operator step in this change: with the app stopped, parse both JSON projections, rewrite each non-null birthday from `MM-DD` to `DD.MM.1900`, validate the complete result through production code, update only `organization_json` plus timestamp, and increment revision once in one transaction. The codebase receives no conversion branch.

## Risks / Trade-offs

- **1900 cannot represent a literal known birth year** → Document it as a reserved sentinel and label it as Unknown year in the form.
- **Current files using `MM-DD` stop importing** → This is deliberate current-only behavior; errors name the accepted `DD.MM.YYYY` format and existing local data is rewritten once before delivery.
- **Three Selects occupy more horizontal space** → Use a responsive three-column group that retains clear labels and dropdown surfaces on narrow screens.
- **A selected day may become invalid after month or year changes** → Clear the impossible day immediately and require a complete valid selection before save.
- **Year-option generation grows over time** → The bounded list is under two hundred items and Radix renders it only while the control is open; no new dependency or network work is introduced.
