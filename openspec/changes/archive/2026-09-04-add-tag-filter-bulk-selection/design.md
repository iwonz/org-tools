## Context

All Employee-filter surfaces reuse `EmployeeSearchInput`, including Employees, Units, Analytics,
Download selection, Editor selection, and Live Unit rules. Its Tag section currently renders one
independent Without tags option followed by a virtualized Tag list, but offers only per-row toggles.
The selected Tag IDs already form bounded durable UI or Live-rule state depending on the caller.

## Goals / Non-Goals

**Goals:**

- Provide the same Select all and Deselect all behavior everywhere the shared Tag filter appears.
- Update the complete available Tag selection in one callback and retain virtualized rendering.
- Preserve accessibility, six-locale coverage, compact visual geometry, and the existing OR-within-
  Tags / AND-between-sections filter semantics.

**Non-Goals:**

- Changing the meaning or state of Without tags during Tag-list bulk actions.
- Adding search, tri-state parent checkboxes, state fields, API changes, dependencies, or migration.
- Adding screenshot scenarios or changing the 56-frame manifest.

## Decisions

1. **Implement the controls once in the shared Tag section.** Two compact ghost buttons render
   between Without tags and the virtualized list. This automatically covers ordinary Employee
   filters, Live Unit rules, Analytics, Unit rosters, and Download pickers without duplicated logic.

2. **Operate on the complete available option set.** Select all derives a unique ordered ID array
   from `tagFilterOptions`; Deselect all sends an empty array. Neither action depends on mounted
   virtual rows, and neither reads or changes `includeWithoutTags`. Select all is disabled when all
   available IDs are already selected; Deselect all is disabled when none are selected.

3. **Use one immutable filter update.** Each action invokes the caller's existing
   `onFiltersChange` exactly once, so automatic UI persistence or Live-rule updates observe one
   logical action. Individual Tag toggles and the section-level clear action remain unchanged.

4. **Keep visual and accessible intent explicit.** Each text button has a thematic leading icon,
   stable geometry, native disabled state, and localized text that also supplies its accessible
   name. No tooltip or additional explanatory label is required.

5. **Keep validation local and deterministic.** Unit tests cover ordered de-duplication and selected
   completeness; browser tests exercise the actual shared controls and filter results in server and
   Pages runtimes. The existing filter screenshot is updated without adding a new gallery entry.

## Risks / Trade-offs

- **Selecting thousands of Tags creates a large selected-ID array.** → Build it only on explicit
  activation in one linear pass; virtualized options remain mounted only for visible rows.
- **Users may expect Select all to include untagged Employees.** → Keep Without tags visibly separate
  and unchanged, matching its existing independent OR option and avoiding an unexpectedly universal
  result set.
- **Catalog changes can make the completeness state stale.** → Derive disabled state from current
  options and selected IDs on every bounded render; existing state validation handles removed Tags.

## Migration Plan

No state or database migration is required. Deployment changes only shared UI behavior, catalogs,
tests, documentation, and the existing screenshot asset; rollback is the inverse code change.

## Open Questions

None.
