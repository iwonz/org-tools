## ADDED Requirements

### Requirement: Structured import has an explicit versioned contract
The application SHALL recognize only JSON objects with `kind: "org-tools-import"`,
`formatVersion: 1`, and exact `employees` and `units` arrays as structured partial imports and SHALL
reject unsupported versions, unknown fields, and malformed values before preview.

#### Scenario: Supported structured document
- **WHEN** a selected JSON file contains the supported kind, version, and valid arrays
- **THEN** the import dialog presents a structured preview instead of Employee field mapping

#### Scenario: Unknown structured field
- **WHEN** a structured import record contains an unknown field or unsupported version
- **THEN** no preview can be committed and an owned localized validation error identifies the issue

### Requirement: Structured Units preserve hierarchy and Live semantics
The application SHALL resolve unique file-local Unit keys, nested child order, manual assignments,
and non-empty Live rules into generated persisted UUID references while using existing graph and
cycle validation.

#### Scenario: Nested manual and Live Units
- **WHEN** a valid document contains nested manual Units and a Live Unit referencing imported Unit keys
- **THEN** the preview preserves hierarchy and order and the candidate uses remapped generated Unit IDs

#### Scenario: Invalid Unit graph
- **WHEN** Unit keys are duplicated, a reference is missing, a Live rule is empty or cyclic, or a Live Unit has direct assignments
- **THEN** the entire structured import is blocked before workspace mutation

### Requirement: Structured Employee identities and assignments are deterministic
The application SHALL match Employees by normalized username first and email second, reuse one
unambiguous existing match without overwriting it, create new Employees for new identities, and
validate every manual Unit assignment and boss.

#### Scenario: Existing Employee assignment
- **WHEN** an import Employee resolves to exactly one existing workspace Employee and a manual Unit references its file key
- **THEN** the existing Employee is assigned to the imported Unit without changing Employee fields

#### Scenario: Conflicting identity or assignment
- **WHEN** identities are ambiguous, incoming identities collide, an Employee key is missing or repeated in one Unit, or multiple bosses are declared
- **THEN** no imported Employee, Unit, or assignment is committed

### Requirement: Structured import merges into Main atomically
The application SHALL preview semantic counts and hierarchy, then append a confirmed structured
import to Main through one strictly validated candidate-state replacement while preserving all
existing data, custom Views, and UI state.

#### Scenario: Successful partial merge
- **WHEN** a user confirms a valid structured preview
- **THEN** new Employees and Units appear in Main, existing custom Views and UI state remain, and generated IDs satisfy the complete-state contract

#### Scenario: Candidate validation failure
- **WHEN** candidate construction, graph validation, or Live resolution fails
- **THEN** the current in-memory workspace remains byte-for-byte equivalent to its pre-import state

#### Scenario: Cancel structured import
- **WHEN** the user closes or cancels a structured preview
- **THEN** no organization state is changed
