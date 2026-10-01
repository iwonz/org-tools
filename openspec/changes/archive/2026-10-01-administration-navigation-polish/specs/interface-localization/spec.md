## ADDED Requirements

### Requirement: Permission and scope labels are localized user language
Administration SHALL display every permission and valid scope through an exhaustive user-facing
label in all six bundled locales. Raw permission identifiers and scope enum values MUST remain
internal to commands and authorization and MUST NOT render in permission selectors or role grant
summaries.

#### Scenario: Edit a permission grant
- **WHEN** a Super Administrator opens a permission or scope selector
- **THEN** every option uses an understandable localized label while its submitted value retains the exact security identifier

#### Scenario: Review a role
- **WHEN** a role grant is shown outside edit mode
- **THEN** both permission and scope use localized labels and no raw identifier is visible

#### Scenario: Add a permission to the registry
- **WHEN** source code adds a new `Permission` or `PermissionScope`
- **THEN** type checking fails until the UI label registry and all locale catalogs cover it
