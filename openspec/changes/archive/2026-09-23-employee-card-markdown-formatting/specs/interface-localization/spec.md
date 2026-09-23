## MODIFIED Requirements

### Requirement: Employee display settings are localized
The system SHALL provide Employee model tabs, four display-section labels, preview copy, Markdown
selection actions, link editor fields and actions, validation feedback, and related accessible names
in all six bundled locale catalogs with identical placeholders and no obsolete keys.

#### Scenario: Open Display in every locale
- **WHEN** the user opens Employee model, selects Display, and edits Markdown in any supported locale
- **THEN** every visible label, validation message, tooltip, and accessible name uses that locale catalog
