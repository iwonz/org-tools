## ADDED Requirements

### Requirement: Employee display settings are localized
The Employee model tabs, four display-section labels, preview copy, and related accessible names MUST
exist in all six bundled locale catalogs with no obsolete keys.

#### Scenario: Open Display in every locale
- **WHEN** the user opens Employee model and selects Display in any supported locale
- **THEN** every new visible label and accessible name uses that locale catalog
