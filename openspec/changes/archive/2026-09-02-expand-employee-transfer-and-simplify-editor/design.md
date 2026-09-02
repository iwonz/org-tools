## Context

Org Tools currently transfers only one complete `{ organization, ui }` document and stores Unit
structure inside a Main/custom View array. Employees use random UUIDs, so independently exported HR
records cannot be reconciled deterministically. The requested workflow must handle 15,000–20,000
records locally while preserving atomic state writes in SQLite and memory-only behavior on Pages.

The owned local database currently contains 145 Employees, one Main View, no custom Views, and no
duplicate identity tuples under the normalization defined below. This permits a lossless one-time
conversion after the runtime is stopped.

## Goals / Non-Goals

**Goals:**

- Provide explicit State and Employees modes for Import and Export.
- Reconcile Employees deterministically with scalable bulk and per-row policies.
- Transfer optional Team assignments without embedding a second organization graph.
- Make one current Unit structure the only Editor document.
- Convert the current local snapshot and immediately enforce one current contract.

**Non-Goals:**

- CSV import, remote HR integrations, background sync, history, or compatibility readers.
- Fuzzy identity matching or silently merging records whose identity hash differs.
- Persisting import candidates, mappings, or conflict choices.

## Decisions

### Employee identity uses full SHA-256

`EmployeeId` is exactly 64 lowercase hexadecimal characters. It is SHA-256 over the UTF-8 bytes of
three normalized fields joined by U+001F in this order: first name, last name, email. Each field is
Unicode NFKC-normalized, trimmed, internal Unicode whitespace is collapsed to one ASCII space, and
lowercased with JavaScript's locale-independent `toLowerCase()`. The full 256-bit digest is retained.

A small audited synchronous SHA-256 implementation keeps create/edit and import transactions
synchronous in both browser bundles without a dependency or Node-only module. Standard known-answer
tests and Node `crypto` parity tests protect the implementation. Editing an identity field computes
the new ID, rejects an existing different Employee with that ID, and atomically re-keys Unit
membership, boss, position, Editor selection, and Download selection references.

Alternatives considered: random UUIDs cannot reconcile imports; truncated UUID-shaped hashes hide
the algorithm and reduce collision resistance; Web Crypto is asynchronous and would split ordinary
MobX commands across await boundaries.

### The public organization owns one structure

The current state becomes:

```ts
organization: {
  employees: OrganizationEmployee[];
  structure: { layoutMode: OrgEditorLayoutMode; units: OrgEditorUnit[] };
}
ui.editor: {
  searchOpen: boolean;
  searchQuery: string;
  selectedItems: OrgEditorSelectedItem[];
  viewport: OrgEditorCanvasViewport;
}
```

`activeViewId`, `ui.views`, Download `sourceViewId`, View metadata, local View Employees, and
Employee overrides are removed. The existing editor store remains the single structural command
engine, but View selection and management stores/components are deleted. Data Download always reads
the current structure.

### Employee transfer is a flat array with nested assignments

Employee Export downloads `org-tools-employees.json`, an array of ordinary Employee field objects
plus `teams`. Each Team assignment contains `id`, `name`, `path` (root-to-Team name array),
`position`, and `isBoss`. IDs are informative; path is the portable match key.

Employee Import accepts one top-level array up to 25 MiB. A mapping step discovers bounded scalar or
array property paths from a sample and maps them to the Employee fields plus `tags` and `teams`.
First name, last name, and email mappings are required because they define identity. Tags and Teams
must already use the current nested item shapes when mapped; invalid rows remain visible and block
Apply.

When Team import is enabled, assignments first match existing Units by ID, then by normalized full
name path. Missing path segments are created as manual Units. Imported assignments upsert the
referenced membership, position, and boss flag while unrelated existing assignments remain intact.
Disabling Team import ignores the array without creating or changing Units.

### Duplicate choices are sparse and atomic

The importer builds one O(n + assignment count) indexed preview. New IDs are created. Existing IDs
use a bulk default of `update`, `skip`, or `teamsOnly`; a sparse Map stores per-Employee overrides.
`update` replaces mapped core fields and also applies Teams when enabled, `skip` changes nothing,
and `teamsOnly` changes only mapped Team assignments. A virtualized review renders only visible
matches. Apply constructs and validates one candidate state before replacing memory, so any invalid
row, duplicate input ID, Unit error, or reference error leaves the current state unchanged.

### Transfer UI stays transient

Import and Export are modal surfaces with State/Employees tabs. Export performs no expensive
Employee projection until the user confirms its selected mode. Import holds the selected File,
sample, mapping, indexes, bulk policy, and sparse overrides only while the modal is open. None of
these enter SQLite, BroadcastChannel, state Export, or browser storage.

## Risks / Trade-offs

- **Identity fields are mutable and therefore IDs change** → one store command re-keys all current
  references and strict validation runs before publication.
- **Two people can intentionally share the same normalized tuple** → the product rejects the second
  record and asks for a distinct email/name tuple; no collision escape alias is introduced.
- **A large JSON parse can briefly use substantial memory** → enforce 25 MiB, retain one parsed
  candidate, derive compact indexes once, virtualize review, and release everything on close.
- **Team paths can be ambiguous after case folding** → reject ambiguous existing paths rather than
  guessing; new paths are created only when Team import is enabled.
- **Removing custom Views is destructive for old files** → no runtime compatibility is promised;
  the owned database is inspected first and converted only because it contains no custom Views.

## Migration Plan

1. Stop Org Tools and record the current revision plus SHA-256 hashes of both JSON columns.
2. Parse the exact old owned snapshot offline, compute every Employee hash, assert uniqueness, take
   the sole Main document, re-key all references, and build the new current state.
3. In one SQLite transaction replace `organization_json` and `ui_json` without changing revision or
   timestamps; immediately validate the bytes with the new production parser.
4. Verify Employee/Unit/assignment counts and semantic fingerprints, then remove the one-off local
   conversion script rather than shipping migration code.
5. If any assertion fails, roll back the transaction and leave the original bytes untouched.

## Open Questions

None. The requested current-only policy and inspected database resolve the compatibility and data
conversion choices.
