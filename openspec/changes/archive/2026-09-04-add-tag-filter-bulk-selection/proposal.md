## Why

Employee filters currently require selecting Tags one at a time. This becomes slow and error-prone
for organizations with a large Tag catalog, especially when the desired filter starts from every
available Tag.

## What Changes

- Add compact Select all and Deselect all actions to the Tag section of every shared Employee
  filter.
- Apply each bulk action to the complete available Tag catalog in one update while keeping the
  existing Without tags option independent.
- Keep individual Tag toggles, section clearing, virtualization, filter semantics, persistence, and
  local-only behavior unchanged.
- Localize the new actions in all six bundled locales and cover them in unit, browser, and visual
  validation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: shared Employee Tag filters gain explicit bulk selection controls.
- `interface-localization`: Select all and Deselect all receive complete six-locale visible and
  accessibility copy.
- `project-tooling`: maintained browser and screenshot validation covers the bulk Tag workflow
  without changing the 56-frame gallery composition.

## Impact

The shared Employee search/filter component, message catalogs, tests, usage/performance guidance,
and existing filter screenshots are affected. `OrgToolsState`, SQLite, Import/Export, public APIs,
dependencies, privacy boundaries, and Tag matching semantics do not change. Bulk actions do not
select or clear the independent Without tags option.
