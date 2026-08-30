## MODIFIED Requirements

### Requirement: Workspace state is current-schema and file-based
The application SHALL keep one strict unversioned `org-tools-state` JSON transfer contract whose
`content` is exactly `workspace`, with required normalized Employee gender, exact keys, UUID
references, and no project or storage metadata. Organization snapshots SHALL stay out of browser
persistence and remote services while a validated workspace MAY persist through SQLite or an
explicit user-selected JSON file. Obsolete partial content values and arbitrary JSON SHALL be
rejected without compatibility fallback.

#### Scenario: Full workspace round trip
- **WHEN** a full state is exported and imported, saved and reopened from SQLite, or written and
  reopened through a browser file handle
- **THEN** Employees, tags, Views, Units, assignments, layout, and valid UI state restore atomically

#### Scenario: Project and file metadata separation
- **WHEN** state is transferred or written
- **THEN** project IDs, names, revisions, database paths, file handles, permissions, and fingerprints
  are absent from the public document

#### Scenario: Obsolete or mismatched state
- **WHEN** a claimed state has an obsolete field, unknown field, non-workspace content, invalid
  gender, reference, or tag date
- **THEN** current memory and durable destinations remain unchanged without migration or mapping
  fallback

## REMOVED Requirements

### Requirement: Partial structured imports preserve the complete state contract
**Reason**: Partial transfers and detached append projections are removed.
**Migration**: Transfer one complete `content: "workspace"` document.

### Requirement: State content matches canonical payload invariants
**Reason**: The contract has one complete payload rather than content-specific subsets.
**Migration**: Validate the complete workspace through the production parser.
