## ADDED Requirements

### Requirement: Employee Import maps advanced custom values
Mapped Employee Import SHALL accept arrays for current multi-option fields and arrays of objects for current Composite fields. Option values SHALL resolve by UUID or normalized label, Composite object properties SHALL resolve by stable subfield UUID or configured name, and the complete candidate SHALL be rejected atomically for unknown, duplicate, missing-required, or incorrectly typed values. Staging a new Import-created field SHALL remain limited to ordinary Value fields.

#### Scenario: Import advanced values
- **WHEN** mapped rows contain valid option arrays and Composite record arrays
- **THEN** the typed values are applied under the existing definitions in the same atomic Import

#### Scenario: Reject malformed advanced values
- **WHEN** one mapped row contains a duplicate Composite primary value or unknown option
- **THEN** no Employee, option catalog, or definition changes

### Requirement: Complete State uses only the current advanced-field shape
Complete State Import and the SQLite runtime SHALL accept only definitions and Employee values with the current exact advanced-field shape. They SHALL NOT add a schema version, legacy reader, automatic migration, or compatibility aliases.

#### Scenario: Load an obsolete field definition
- **WHEN** a complete State omits newly required Option mode properties or contains an obsolete custom value shape
- **THEN** strict validation rejects it without mutating current state
