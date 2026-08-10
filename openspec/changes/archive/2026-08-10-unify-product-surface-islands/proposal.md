## Why

The application now has consistent control switchers, but populated product views still feel like
loose controls placed directly on the shell. Employees, Teams, Analytics, Download, and Org Editor
need clear surface ownership and denser internal grouping without reintroducing decorative rules.

## What Changes

- Wrap populated Employees search, counts, actions, and list in one bounded surface island.
- Wrap populated Teams hierarchy and Employee pane in one island, with tighter internal padding at
  the pane seam.
- Wrap Analytics header and grid in one island, retain subtle group backgrounds, and reduce the
  horizontal and vertical gaps between groups.
- Wrap the complete Download selection workflow in one island.
- Move the Org Editor View selector and View actions into the top-right action group; flatten all
  top controls into one shared island.
- Place Org Editor search last in the top island and change it to reveal its field to the right of
  the search trigger.
- Combine zoom, scale reset, and primary-Team focus into one bottom-left island.
- Preserve empty states, keyboard behavior, responsive containment, all workflows, and localization.
- Keep public state, import/export formats, organization data, and browser-only privacy unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Define single-island product surfaces and denser Analytics grouping.
- `organization-editor`: Define the top-right and bottom-left Editor control islands, View placement,
  and search reveal direction.

## Impact

Employees, Teams, Analytics, Download, Org Editor controls, browser tests, usage/performance
documentation, and deterministic screenshots change. No dependencies, storage, network behavior,
public schema, or file output changes.
