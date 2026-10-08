## Why

The Editor Employee form incorrectly requires at least one Unit assignment, even though the global
catalog permits unassigned Employees and the Editor can already remove the final assignment through
its context menu. This makes equivalent workflows disagree and prevents a valid View-local state
from being saved through the form.

## What Changes

- Allow Employee create and edit forms to save zero Unit assignments in the system View and every
  custom View.
- Define zero assignments as a valid, explicit View-local result: saving removes the Employee from
  every manual Unit in that View without deleting the global Employee or changing other Views.
- Remove the obsolete minimum-Unit validation message and disabled Save state.
- Cover form behavior, View isolation, persistence, authorization, and the existing context-menu
  removal path with regression tests.
- Update user documentation to state that Employees may remain in the catalog without a Unit.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: Employee assignment editing accepts an empty assignment list consistently in
  global and Editor workflows.

## Impact

The Employee dialog, assignment store tests, browser coverage, Employee model specification, usage
documentation, and six localization catalogs are affected. Persistent State, PostgreSQL schema,
API wire shapes, permissions, projections, exports, and third-party data flows do not change.
