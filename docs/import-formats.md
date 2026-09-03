# JSON transfer formats

Global Import provides two explicit JSON modes: **All state** and **Employees**. Global Export always
downloads **All state** directly. Every transfer is local and user initiated; no source or candidate
is sent to a remote service or retained after the dialog closes.

## All state

The current complete, unversioned state is:

```ts
type OrgToolsState = {
  organization: {
    employeeFieldDefinitions: CustomEmployeeFieldDefinition[];
    employees: OrganizationEmployee[];
    structure: {
      layoutMode: "leftRight" | "topDown";
      units: OrgEditorUnit[];
    };
    tags: EmployeeTagDefinition[];
  };
  ui: OrgToolsUiState;
};
```

No additional top-level properties are accepted. There is no `kind`, `content`, version, partial
scope, compatibility alias, or migration reader. Older View-based state files are rejected without
mutation. Import validates one detached candidate up to 25 MiB and atomically replaces the current
state after confirmation. Export downloads `org-tools-state.json`.

## Employees

Employee Import accepts a top-level array whose optional mapped `teams` property uses this portable
assignment shape:

```ts
type EmployeeImportRecord = Record<string, unknown> & {
  id: string;
  teams?: Array<{
    id: string;
    name: string;
    path: string[];
    position: string | null;
    isBoss: boolean;
  }>;
};
```

The Employee `id` mapping is mandatory and contains a UUID. `path` is the portable root-to-Team name
path. A Team `id` can identify an existing Team from the current state.

The optional mapped `birthday` field is either null or one zero-padded `DD.MM.YYYY` string. A real
known year starts at 1901 and cannot be in the future. `1900` is reserved to mean that only day and
month are known; `29.02.1900` is valid unknown-year data. `MM-DD`, ISO dates, timestamps, partial
dates, and locale-dependent text are rejected without conversion.

Employee Import accepts a top-level array of objects up to 25 MiB. Source properties may be flat or
nested. One linear read discovers their paths and selects the first record with the greatest number
of mappable paths; at most 128 KiB of that record is shown beside left-to-right source-path → fixed-field
mapping rows. UUID, first name, last name, and email mappings are mandatory. When mapped, tags must be
`{ label, date }` objects and Teams must use the exact shape above. An empty Teams mapping means no
Team import and removes the Teams-only duplicate policy. Existing Teams match by
ID and then normalized full path; missing paths become manual Teams. Imported assignments are
additive and preserve unrelated membership.

Existing custom Value fields appear as ordinary mapping rows. A new Value field may be prepared
with its display name, unique token key, type, and options; its definition and all values are added
only if the complete candidate passes strict validation. Template fields never accept imported
values. Imported Tags contribute label and optional date only: missing normalized labels create
neutral catalog entries, while colors always remain controlled by the current Tag catalog.

The virtualized review separates rows into **Will be added**, **Duplicates**, and **Will not be
added**. New Employees use Add or Skip. Identity duplicates use a bulk choice—**Update data**,
**Skip**, or **Teams only**—with an optional per-row override. The full candidate is built and
validated once before one atomic replacement.

## Stable Employee identity and duplicate detection

Every Employee ID is a UUID v4 and remains stable when a name or email changes. Duplicate detection
uses this separate normalized tuple:

```text
normalize(firstName) + U+001F + normalize(lastName) + U+001F + normalize(email)
```

Each part uses Unicode NFKC, surrounding trim, internal Unicode whitespace collapsed to one ASCII
space, and locale-independent lowercase. Missing email normalizes to an empty string. Manual create
and edit reject a second normalized tuple. Import preserves the imported UUID for a new Employee,
retains the current UUID for an identity duplicate, and rejects a UUID already owned by a different
identity or ambiguous duplicate rows inside one file.

Structured report JSON, templates, and PNGs from Data Download or Editor export are output artifacts and
cannot be imported by either transfer mode.
