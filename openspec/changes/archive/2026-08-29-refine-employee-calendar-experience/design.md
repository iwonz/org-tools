## Context

Employee data flows through shared persisted fields into strict state parsing, View-local copies and
overrides, derived runtime Employees, search documents, generic import, and Download output. Gender
therefore cannot be added only to the form without creating partial or lossy behavior. Separately,
Calendar and Editor use local component state and derived indexes, but several presentational choices
currently weaken interaction affordances or duplicate explanatory copy.

The worktree already contains completed, uncommitted sidebar and Calendar refinements. This change
must preserve those edits and layer its behavior on top of the current files.

## Goals / Non-Goals

**Goals:**

- Add one normalized, strictly validated Employee gender value throughout the current data contract.
- Limit gender to Male, Female, and Not specified in the persisted enum and every selector.
- Provide exact-value gender filtering without scanning or rebuilding Employee records during render.
- Make ordinary import and local Download preserve the field.
- Reuse the ordinary Employee row action treatment inside Calendar day details.
- Give every Calendar day stable geometry and an explicit interaction state, with stronger current-day
  emphasis and locale-clean month headings.
- Reduce redundant form copy, tag-row height, and translucent Editor hover feedback.
- Replace the native tag date field with a localized calendar-grid popover without repeated label
  copy.

**Non-Goals:**

- Inferring gender from names, profile data, avatars, or any other Employee field.
- Gender-driven Live rules, analytics, Calendar groups, or remote enrichment.
- Adding schema versions, compatibility readers, migrations, persistence, or server behavior.
- Changing birthday or dated-tag date semantics.

## Decisions

### Use one required enum in every Employee shape

`EmployeeGender` will be `male | female | unspecified`, and `gender` will be required on
`EditableEmployeeFields`, persisted Employees, View-local Employees and overrides, and derived
Employees. New forms and ordinary imports default to `unspecified`. The normalizer and strict parser
reject any other value, and exact-key state validation requires the field. A nullable or optional
field was rejected because it creates two representations of the same “not specified” state and
would silently preserve the obsolete public shape.

Ordinary mapping accepts bounded English aliases and normalizes them to the enum; an invalid mapped
value invalidates the row and therefore the detached import candidate. Download exposes the raw
stable enum as a selectable Employee field. No translation is stored in state.

### Filter through the existing derived search document

The Employee search document will carry the normalized gender alongside birthday and tag indexes.
`EmployeeSearchFilters` will store selected enum values, include them in its stable key and active
count, and require an exact match when any are selected. This keeps filtering O(n) over the existing
virtualized result path without extra Employee copies or per-row normalization.

### Share Employee row actions, keep dialog ownership local

A small presentational component will render tag, edit, and delete buttons for one Employee. The
Employees tab and Calendar day dialog will share it, while each workflow owns its edit/delete dialog
state. Calendar stores the selected ISO day key and re-derives the day from current indexes so edits
or deletion update the open list instead of leaving a stale Employee snapshot.

### Make Calendar cells uniformly interactive

Every in-month date will render as a button with a fixed top date row and content area, so empty and
populated cells use the same layout. Pointer hover, keyboard focus, and cursor feedback apply to all
cells; today uses a signal-colored date badge plus a restrained tonal cell treatment. The month title
will concatenate a localized month-only formatter with a locale-formatted numeric year, avoiding
locale-added year abbreviations.

The day dialog removes its visible description, passes `p-0` to the virtualized Employee list, and
uses shared row actions. Semantic headings and the dialog title remain sufficient structure.

### Tighten chrome without changing meaning

Quick tag rows shrink from 62 px to 44 px, which still fits the 36 px date action and maintains the
virtualizer estimate. Editor toolbar hover backgrounds become opaque accent surfaces. Visible helper
copy under Employee titles/avatar controls and the Membership mode label are removed; the mode tabs
retain their accessible group label.

### Use a local UI-kit calendar for tag dates

A shared Calendar wrapper will use `react-day-picker` inside the existing Radix popover. It will
receive the active interface locale, use a single selected day, and convert only at the boundary
between local calendar Dates and the existing `YYYY-MM-DD` tag value. The popover will omit the tag
label because the trigger already owns that context, and will keep one explicit Clear date action.
The dependency ships in the static bundle and performs no request, persistence, telemetry, or remote
date lookup. A styled wrapper is preferred over a native date input so the interaction and themes
remain consistent across supported browsers.

## Risks / Trade-offs

- [Existing state files without gender become invalid] → Treat this as the intentional replacement
  current schema, update every fixture and document, and test missing/unknown values atomically.
- [Calendar edit/delete actions can invalidate the open day] → Store the selected date key and derive
  current rows from indexes; keep the dialog open with the appropriate empty state.
- [Compact tag rows could clip controls] → Keep 44 px height, center all three columns, and assert the
  computed row and action bounds in Chromium.
- [New filter state could affect Live filters unintentionally] → Add gender only to transient Employee
  search filters; persisted Live rule types remain unchanged.
- [Shared row actions may couple workflows] → Share only presentational controls and callbacks, not
  dialog state or store mutation ownership.
- [Calendar libraries can inflate the client bundle or change date semantics] → Use one focused
  dependency, single-date mode, active bundled locales, and UTC-safe ISO conversion at the popover
  boundary.

## Migration Plan

Replace the public Employee shape in place, update parser exact keys, every fixture, examples that
claim state, tests, and documentation in the same change. There is no runtime migration or fallback.
Rollback requires reverting the complete change and its generated gallery together.

## Open Questions

None.
