# JSON transfer formats

The global Import and Export actions provide two explicit JSON modes: **All state** and
**Employees**. Both are local, user-initiated transfers. Neither format is sent to a remote service
or retained as an import candidate.

## All state

The current complete, unversioned state is:

```ts
type OrgToolsState = {
  organization: {
    employees: OrganizationEmployee[];
    structure: {
      layoutMode: "leftRight" | "topDown";
      units: OrgEditorUnit[];
    };
  };
  ui: OrgToolsUiState;
};
```

No additional top-level properties are accepted. There is no `kind`, `content`, version, partial
scope, compatibility alias, or migration reader. Older View-based state files are rejected without
mutation. Import validates one detached candidate up to 25 MiB and atomically replaces the current
state after confirmation. Export downloads `org-tools-state.json`.

## Employees

Employee Export downloads `org-tools-employees.json` as one flat JSON array. Each record contains
the persisted Employee fields and a nested `teams` array:

```ts
type EmployeeTransferRecord = OrganizationEmployee & {
  teams: Array<{
    id: string;
    name: string;
    path: string[];
    position: string | null;
    isBoss: boolean;
  }>;
};
```

`path` is the portable root-to-Team name path. `id` identifies an existing Team when both files came
from the same state. Export includes resolved membership in manual and Live Teams.

Employee Import accepts a top-level array of objects up to 25 MiB. Source properties may be flat or
nested; the mapping screen maps property paths to current Employee fields, tags, and Teams. First
name, last name, and email mappings are mandatory. When mapped, tags must be `{ label, date }`
objects and Teams must use the exact shape above. Team import is optional. Existing Teams match by
ID and then normalized full path; missing paths become manual Teams. Imported assignments are
additive and preserve unrelated membership.

Existing Employees use a bulk choice—**Update data**, **Skip**, or **Teams only**—with an optional
per-row override. The full candidate is built and validated once before one atomic replacement.

## Deterministic Employee identity

Every Employee ID is the full lowercase hexadecimal SHA-256 digest of:

```text
normalize(firstName) + U+001F + normalize(lastName) + U+001F + normalize(email)
```

Each part uses Unicode NFKC, surrounding trim, internal Unicode whitespace collapsed to one ASCII
space, and locale-independent lowercase. SHA-256 hashes the UTF-8 bytes; the complete 64-character
digest is retained. Missing email normalizes to an empty string. Identity edits atomically re-key
all Team, boss, position, Editor-selection, and Download-selection references. A duplicate digest is
rejected.

CSV, report JSON, templates, and PNGs from Data Download or Editor export are output artifacts and
cannot be imported by either transfer mode.
