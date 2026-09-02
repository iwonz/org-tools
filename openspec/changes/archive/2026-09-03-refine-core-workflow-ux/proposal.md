## Why

Several core workflows still expose dead ends or inconsistent controls: an unreadable SQLite database cannot be replaced from the startup screen, Template tokens require scanning button catalogs, Download panels move when their source changes, Employee mapping obscures source-to-target flow, and Employee and Calendar dialogs diverge from the product's shared controls. These gaps make routine local organization work slower and less predictable, especially for large datasets.

## What Changes

- Add an explicit, confirmed Create new database recovery action that preserves the existing database file set as a timestamped backup before creating the exact current schema.
- Replace Template token button catalogs with one shared Format input that offers localized, keyboard-accessible token suggestions after `@` while retaining the existing `{token}` format.
- Keep Download source and selection panels geometrically stable, align their searches, place the Continue icon after its label, and always expose Unit-name search.
- Redesign Employee-array Import around one representative JSON record and clear source-path-to-Org-Tools-field mapping rows, including ordinary Tag and Unit mappings.
- Render Calendar day details as one vertically grouped, virtualized sequence of Birthdays and per-tag Employee lists.
- Replace the Employee gender Select with a segmented radio switcher, combine birthday selectors into one control, reuse the standard Tag picker inside the draft form, and use generic Unit terminology.
- Preserve the strict public `OrgToolsState`, automatic persistence, current Employee identity, and local-only privacy boundary.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `single-state-runtime`: Add explicit backed-up database recreation and a private create-new API operation without automatic reset or compatibility behavior.
- `state-transfer`: Define representative Employee JSON preview, source-to-target mapping, and mapping-driven Unit import.
- `data-export`: Define the shared `@` token suggestion input while preserving `{token}` serialization.
- `dated-employee-tags`: Group Calendar day events by tag above ordinary Employee cards in one vertical virtualized flow.
- `employee-model`: Define the segmented gender, compound birthday, draft Tag picker, and generic Unit terminology in Employee forms.
- `interface-chrome`: Define stable Download geometry, aligned searches, trailing Continue affordance, and updated form and Calendar control composition.
- `interface-localization`: Cover new recovery, token, representative-preview, and form copy in both bundled locales.
- `organization-editor`: Apply the shared Template input and generic Unit terminology to Editor workflows.
- `project-tooling`: Expand the maintained screenshot gallery to forty current frames and validate the new recovery and workflow scenarios.

## Impact

- Server state repository and `/api/state` gain an explicit POST recovery operation; Pages remains API-free.
- State runtime, Template export, Download, Unit browsing, Employee Import, Calendar, and Employee form components change.
- Import parsing performs one bounded linear analysis to select a representative record; large lists remain virtualized.
- Documentation, localized catalogs, browser/unit tests, OpenSpec capabilities, and deterministic screenshots are updated together.
- No dependency, public state schema, stored Template syntax, remote service, telemetry, or compatibility layer is introduced.
