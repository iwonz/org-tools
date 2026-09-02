## Why

Complete-state transfer is safe but too coarse for moving a large Employee catalog between
organizations, reconciling an updated HR extract, or preserving selected Team assignments. Custom
Editor Views also duplicate organization state and make the transfer contract harder to reason
about even though the product now needs one current structure.

## What Changes

- **BREAKING** Replace UUID Employee identifiers with deterministic lowercase SHA-256 identifiers
  derived from normalized first name, last name, and email; reject duplicate identities and re-key
  all Employee references when identity fields change.
- **BREAKING** Replace the public array of Views with one current organization structure and one
  Editor UI projection; remove custom View creation, selection, rename, deletion, local Employees,
  overrides, and Download source selection.
- Replace direct state Export with a modal that selects either complete state or a flat Employee
  JSON array containing nested Team assignments and boss status.
- Replace state-only Import with State and Employees tabs. Employee Import accepts a bounded JSON
  array, maps source fields, optionally imports Teams, previews identity matches, and supports both
  a bulk conflict policy and per-Employee overrides before one atomic apply.
- Keep transfer, mapping, matching, preview, and apply local-only, virtualize large previews, and
  support 20,000 Employees without rendering or repeatedly reprocessing the complete array.
- Convert the owned local SQLite snapshot once while the runtime is stopped. No compatibility
  readers, format versions, legacy fields, or runtime migration branches remain afterward.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: Define deterministic SHA-256 identity, duplicate prevention, and atomic re-keying.
- `state-transfer`: Define State/Employees Import and Export, mapping, Team assignment transfer, and duplicate policies.
- `organization-editor`: Replace Main/custom Views with one current Unit structure and remove View controls.
- `interface-chrome`: Replace direct transfer actions with accessible scalable modal workflows.
- `interface-localization`: Cover all new mapping, duplicate, policy, and validation copy in English and Russian.
- `privacy-safety`: Bound local Employee transfer and prohibit persistence or transmission of import candidates.
- `single-state-runtime`: Define the new single-structure state shape and current-only SQLite snapshot.
- `project-tooling`: Update large-data coverage, documentation, fixtures, and the screenshot catalog.

## Impact

The change affects public types and strict parsing, Employee create/edit and every ID reference,
SQLite snapshot bytes, state Import/Export, Editor and Download UI, MobX structure ownership,
localization, unit/browser/performance tests, canonical specs, documentation, and deterministic
screenshots. `OrgToolsState` remains unversioned and current-only. CSV/template/PNG reporting in
Data Download remains separate. Network access, accounts, history, external synchronization, and
automatic schema compatibility are explicit non-goals.
