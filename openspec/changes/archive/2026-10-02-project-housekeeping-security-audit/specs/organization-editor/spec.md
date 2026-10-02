## ADDED Requirements

### Requirement: Current Editor documents use the authenticated server boundary
The Editor SHALL load strict organization and View documents only from the authenticated PostgreSQL
runtime. Parsing MUST NOT expose SQLite, legacy State Import, Open Position, Analytics, or
browser-only source readers. Explicitly specified value-level canvas normalization remains part of
the current parser contract.

#### Scenario: Load an authorized current View
- **WHEN** the server returns a valid current authorized projection
- **THEN** Editor geometry, history, DOM, and PNG use the authorized document and its specified canonical normalization

#### Scenario: Submit a removed top-level Editor shape
- **WHEN** a mutation contains a removed resource field or misses a required current field
- **THEN** strict validation rejects the complete candidate atomically
