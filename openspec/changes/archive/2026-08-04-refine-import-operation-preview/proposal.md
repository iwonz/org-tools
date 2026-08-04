## Why

Recognized partial-state import currently presents its operation choices as an undifferentiated
stack, while its preview drops Team assignments and cannot show the Employees that will be imported.
Users need a clearly separated Append/Replace choice and an accurate, scalable view of Team
hierarchy, Employee assignments, and Employee-only content before committing an atomic import.

## What Changes

- Present Append and Replace all current as a distinct responsive choice-card section with a clear
  destructive treatment for replacement.
- Extend the internal import preview plan with manual assignments and Live role references while
  keeping Employee records normalized and shared by key.
- Render a virtualized, collapsible Team hierarchy with read-only Employee cards, hierarchy guides,
  positions, boss state, tags, and append identity status.
- Render Employee-only projections as Employee cards and retain a separate catalog section for
  Employees without a direct manual assignment.
- Reuse the hierarchical preview for recognized state and generic mapped Team imports without
  changing candidate validation or mutation semantics.
- Keep all previews browser-local, bounded, bilingual, and usable at the maintained 20,000 Employee
  and 4,000 Team target.
- Simplify publication safeguards and documentation to describe general repository hygiene without
  project-origin-specific terminology.
- Do not change `OrgToolsState`, state projection invariants, filenames, import matching, Append,
  Replace, Full workspace replacement, generic JSON mapping, or atomic validation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `structured-import`: Require a separated partial-state operation selector and an accurate
  virtualized hierarchy/Employee preview.
- `tabular-import`: Apply the same Team and Employee preview to mapped generic JSON.
- `interface-localization`: Localize the new preview structure, statuses, roles, and operation
  section in English and Russian.
- `privacy-safety`: Preserve the browser-only preview boundary while expressing publication safety
  through general artifact checks.
- `project-tooling`: Extend deterministic browser and screenshot coverage for the import preview and
  retain general publication checks.

## Impact

The change affects the internal structured-import preview types and planner, the import dialog,
message catalogs, unit and Playwright coverage, deterministic screenshots, publication checks,
OpenSpec capabilities, and import/privacy/performance documentation. It adds no dependency, network
path, persistence, public schema field, compatibility layer, or migration.
