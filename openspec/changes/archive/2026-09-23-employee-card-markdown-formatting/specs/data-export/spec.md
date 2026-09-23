## MODIFIED Requirements

### Requirement: Editor PNG starts from the persisted Employee export format
Scoped and full-View Editor Image export SHALL initialize Employee content from the persisted Editor
export format. The local Image format SHALL remain a transient override and SHALL support Employee,
Tag, contextual Unit, and custom-field tokens plus inline Markdown. PNG painting MUST use the same
normalized rich lines, font marks, inert safe-link styling, native Tag chips, neutral position
badges, wrapping, and row geometry contract as Editor cards while applying the export format
independently.

#### Scenario: Open Editor Image export
- **WHEN** the Image export dialog opens
- **THEN** its Employee format equals the current persisted Editor-export format

#### Scenario: Override one export
- **WHEN** a user changes the Employee format inside an Image export dialog
- **THEN** preview, copy, and save use the local value without changing the persisted model format

#### Scenario: Paint rich Employee content
- **WHEN** an exported Employee format contains Markdown, colored dated Tags, and a position
- **THEN** preview, copied PNG, and saved PNG paint matching text marks, chip surfaces, wrapping, and Unit geometry without an active link or remote request
