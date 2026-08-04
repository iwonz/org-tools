# Import formats

The application accepts one strict state contract plus ordinary JSON mapping. Every file is
limited to 25 MiB, processed only in the current browser page, previewed before commit, and applied
through a detached candidate.

## Scoped Org Tools state

```ts
type OrgToolsStateContent = "teams" | "employees" | "teamsEmployees" | "workspace";

type OrgToolsState = {
  kind: "org-tools-state";
  content: OrgToolsStateContent;
  activeViewId: string;
  employees: WorkspaceEmployee[];
  views: OrgView[];
  ui: UiState;
};
```

The contract has exact fields and no format or schema version. UUIDs, references, Live dependency
graphs, tag dates, avatars, URLs, and `content` invariants are strictly validated. JSON that claims
`kind: "org-tools-state"` but fails validation is rejected and never falls through to ordinary
mapping.

- `teams` contains one Main View with hierarchy, order, coordinates, layout, viewport, and Live
  filters. Employees, assignments, bosses, positions, overrides, and custom Views are absent.
- `employees` contains the complete global Employee catalog and one empty Main View.
- `teamsEmployees` contains the complete catalog and complete Main View, including manual roles and
  Live overrides, but no custom Views.
- `workspace` contains the complete workspace with Main and custom Views plus UI state.

The workspace Export dialog downloads those values as `org-tools-teams.json`, `org-tools-employees.json`,
`org-tools-teams-employees.json`, and `org-tools-state.json`.

When importing, a state exposes only projections carried by its `content`. Partial projections offer
Append, the safe default, or Replace all current. Append reuses one unambiguous Employee identity by
username then email without overwrite, generates new UUIDs, remaps references, appends roots, and
translates the source layout into a free Main area while preserving current custom Views and UI.
Partial replace deletes all current organization data and installs a clean selected projection. The
Import mode section presents Append and Replace as separate choice cards, with replacement styled as
destructive. Full workspace always replaces and displays a dedicated destructive warning.

## Ordinary JSON

Ordinary JSON can be mapped as Teams, Employees, or Teams + Employees. Select the root object
collection, then map source fields. A Team collection can map recursive `children`; combined import
can also map an inline `employees` array. The same field mapping applies at every nested level.

Generic Teams are manual. Live filters and Live roles are accepted only in a recognized scoped
state. Employee tags from ordinary mapping are undated.

## Validation and current-schema policy

Preview renders the ordered Team tree, nested manual assignment cards, separate Live role cards,
Employees without direct manual assignments, new/reused identity state, counts, and errors through a
bounded virtualized viewport. Employee-only state renders its complete catalog without an empty-Team
placeholder.
Ordinary mapping always appends. Cancellation or any parsing, mapping, identity, graph, reference, or
candidate error leaves the current workspace unchanged.

Public Org Tools files intentionally contain no format or schema version. When the public state
schema changes, the repository replaces the former type, reader, fixtures, documentation, and tests
instead of retaining compatibility branches.
