## ADDED Requirements

### Requirement: Replacement import completes without a filename notice
The application SHALL close a successful partial or Full workspace replacement import without
rendering a global opened-file success banner, while preserving localized errors and successful
Append feedback.

#### Scenario: Successful replacement
- **WHEN** a user confirms a valid partial or Full workspace replacement import
- **THEN** the dialog closes, the candidate becomes current, and no global filename success banner is rendered

#### Scenario: Successful append
- **WHEN** a user confirms a valid Append import
- **THEN** the existing localized merge summary remains visible

#### Scenario: Failed replacement
- **WHEN** replacement candidate validation or commit fails
- **THEN** the current workspace remains unchanged and the localized error remains visible
