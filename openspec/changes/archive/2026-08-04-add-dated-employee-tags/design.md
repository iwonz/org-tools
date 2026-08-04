## Context

Employees currently store tags as normalized strings across the global catalog, materialized View employees, View overrides, structured files, search documents, Live filters, cards, and editors. Birthdays are the calendar's only event source. The new assignment-specific date must cross those boundaries without changing tag identity or introducing browser persistence, network traffic, or an expensive second source of truth.

The application must continue to open State V1 and Import V2 files, strictly reject ambiguous input, remain atomic on import, support 20,000 Employees, and preserve English-only source artifacts outside the Russian catalog.

## Goals / Non-Goals

**Goals:**

- Use one normalized runtime `EmployeeTag` model with a label and nullable ISO date.
- Read legacy formats through explicit migration and write only State V2 and Import V3.
- Preserve label-only search, Live filtering, identity, and the existing `tags` export.
- Support single and bulk date editing with deterministic mixed-state behavior.
- Derive birthday and dated-tag calendar events efficiently and expose accessible bilingual detail dialogs.

**Non-Goals:**

- Recurring tag dates, reminders, notifications, synchronization, or server storage.
- Date mapping in CSV or ordinary JSON imports.
- Storing image sources, locale, or organization data outside the existing in-memory boundary.

## Decisions

### Normalize tags as records at the model boundary

Every current Employee representation uses `{label, date}` records. Shared helpers trim labels, compare labels with the existing locale-independent case-folding rule, validate real `YYYY-MM-DD` dates, and project labels for search, Live rules, and compatibility exports. This avoids branching throughout the UI. Keeping parallel `tags` and `tagDates` arrays was rejected because they can drift and make assignment updates non-atomic.

### Migrate old formats before candidate construction

The strict state parser recognizes versions 1 and 2. Version 1 string tags become records with null dates, while version 2 must contain exact tag records. The structured parser similarly recognizes versions 2 and 3 and returns one normalized V3 document. Writers emit only the newest versions. Unknown fields, invalid dates, and duplicate labels with conflicting dates fail before workspace mutation.

### Keep identity and matching label-based

Dates do not participate in tag equality, option aggregation, search documents, or Live filters. A case-insensitive label can occur only once per Employee. Adding a tag without a date retains an existing assignment date; removing the label removes the entire record. This keeps current filters stable when users annotate a tag.

### Derive calendar indexes from canonical Main Employees

Shared derived indexes expose dated events by exact ISO day and grouped by normalized label. Birthdays remain month-day values and are projected into the selected year, including a February 28 fallback for February 29 in non-leap years. Calendar rendering reads indexed results rather than rescanning all Employees per cell. Grouped event rows are sorted only when displayed and virtualized for large sets.

### Treat editor changes as draft or atomic store actions

The Employee dialog edits dates in its draft. Quick and bulk tag editors invoke store actions that preserve existing dates unless a date operation is explicit. Bulk date controls expose no value when selected Employees have different dates and apply one set or clear operation to all selected Employees that carry the label.

### Bound the calendar surface

The cloud is a two-line overflow-hidden region with a disclosure for hidden labels. Day cells show birthday avatars and at most two dated-tag event chips plus a count. Detailed day and tag dialogs carry the full information. This preserves the maintained desktop fit while smaller viewports retain safe scrolling.

## Risks / Trade-offs

- **Larger saved files and runtime records** -> Store only one nullable date per assignment and keep derived indexes label/date based.
- **Ambiguous legacy or duplicated tag data** -> Normalize once, merge identical duplicates, and reject conflicting dates atomically in strict file readers.
- **Native date controls vary by browser** -> Validate independently of browser controls and retain an explicit clear action.
- **Large tag-event dialogs** -> Use flat virtualized rows and precomputed group membership.
- **Calendar density can exceed a cell** -> Cap inline events and expose full localized dialogs without data loss.

## Migration Plan

1. Add shared tag/date types and validation helpers.
2. Extend strict readers with V1-to-V2 state and V2-to-V3 import migration, then change writers to latest versions.
3. Migrate stores, search, Live matching, editors, and exports to the normalized runtime model.
4. Add derived calendar indexes and calendar interaction surfaces.
5. Update bilingual catalogs, documentation, tests, and deterministic screenshots.

Rollback remains possible by reverting the change. Files newly saved as State V2 or Import V3 are intentionally not readable by older builds, while no in-browser migration is persisted automatically.

## Open Questions

None. Product defaults in the proposal and capability specifications resolve date recurrence, cloud scope, bulk behavior, and compatibility direction.
