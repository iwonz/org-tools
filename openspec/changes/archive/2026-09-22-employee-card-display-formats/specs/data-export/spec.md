## ADDED Requirements

### Requirement: Editor PNG starts from the persisted Employee export format
Scoped and full-View Editor Image export SHALL initialize Employee text from the persisted Editor
export format. The local Image format SHALL remain a transient override and SHALL support Employee,
Tag, contextual Unit, and custom-field tokens. PNG painting MUST use the same normalized lines and
row geometry contract as Editor cards while applying the export format independently.

#### Scenario: Open Editor Image export
- **WHEN** the Image export dialog opens
- **THEN** its Employee format equals the current persisted Editor-export format

#### Scenario: Override one export
- **WHEN** a user changes the Employee format inside an Image export dialog
- **THEN** preview, copy, and save use the local value without changing the persisted model format
