## ADDED Requirements

### Requirement: Complete State transfer requires Unit notes
Every Unit in the current exact State contract SHALL contain `noteMarkdown`. Complete State Export
SHALL include the source exactly after normalization, and complete State Import SHALL reject a Unit
that omits the field, provides a non-string value, or exceeds the UTF-8 bound. Employee transfer
SHALL NOT expose or modify Unit notes.

#### Scenario: Export and import noted Units
- **WHEN** a valid complete State containing notes is exported and imported
- **THEN** every View-local Unit note is preserved exactly

#### Scenario: Import the former Unit shape
- **WHEN** a complete State contains a Unit without `noteMarkdown`
- **THEN** strict validation rejects the file atomically without changing current state
