## MODIFIED Requirements

### Requirement: Structured import has an explicit versioned contract
The application SHALL recognize only JSON objects with `kind: "org-tools-import"`,
`formatVersion: 2`, and exact `employees` and `units` arrays as structured partial imports and SHALL
reject version 1, unsupported versions, unknown fields, and malformed values before preview.

#### Scenario: Supported structured document
- **WHEN** a selected JSON file contains the supported kind, version 2, and valid arrays
- **THEN** the import dialog presents a structured preview instead of Employee field mapping

#### Scenario: Removed version 1 document
- **WHEN** a selected structured file uses format version 1
- **THEN** no preview can be committed and an owned localized unsupported-version error is shown

#### Scenario: Unknown structured field
- **WHEN** a structured import record contains an unknown field or unsupported version
- **THEN** no preview can be committed and an owned localized validation error identifies the issue

### Requirement: Structured Units preserve hierarchy and Live semantics
The application SHALL resolve unique file-local Unit keys, nested child order, manual assignments,
non-empty Live rules, optional Live boss references, and unique Live position overrides into
generated persisted UUID references while using existing graph and cycle validation.

#### Scenario: Nested manual and Live Units
- **WHEN** a valid document contains nested manual Units and a Live Unit referencing imported Unit and Employee keys
- **THEN** the preview preserves hierarchy and order and the candidate remaps Units, Live boss, and position overrides to generated or resolved IDs

#### Scenario: Invalid Unit graph
- **WHEN** Unit keys are duplicated, a reference is missing, a Live rule is empty or cyclic, Live overrides repeat an Employee, or mode-specific fields are used on the wrong Unit mode
- **THEN** the entire structured import is blocked before workspace mutation

### Requirement: Structured Employee identities and assignments are deterministic
The application SHALL match Employees by normalized username first and email second, reuse one
unambiguous existing match without overwriting it, create new Employees for new identities, and
validate every manual assignment, manual boss, Live boss, and Live position override reference.

#### Scenario: Existing Employee Live role
- **WHEN** an import Employee resolves to exactly one existing workspace Employee and a Live Unit references its file key
- **THEN** the candidate uses that Employee for the Live boss or position override without changing Employee fields

#### Scenario: Conflicting identity or role
- **WHEN** identities are ambiguous, incoming identities collide, or any role reference is missing or repeated illegally
- **THEN** no imported Employee, Unit, assignment, boss, or override is committed

### Requirement: Structured import merges into Main atomically
The application SHALL preview semantic counts and hierarchy, then append a confirmed version 2
structured import to Main through one strictly validated candidate-state replacement while
preserving all existing data, custom Views, and UI state.

#### Scenario: Successful partial merge
- **WHEN** a user confirms a valid version 2 structured preview
- **THEN** new Employees and Units appear in Main with remapped assignments and Live roles while existing custom Views and UI state remain

#### Scenario: Candidate validation failure
- **WHEN** candidate construction, graph validation, role resolution, or Live resolution fails
- **THEN** the current in-memory workspace remains byte-for-byte equivalent to its pre-import state

#### Scenario: Cancel structured import
- **WHEN** the user closes or cancels a structured preview
- **THEN** no organization state is changed
