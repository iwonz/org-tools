## ADDED Requirements

### Requirement: Card formats participate in custom-field dependencies
All four persisted Employee display formats SHALL expose valid custom field keys. Renaming a custom
field key MUST rewrite parsed references in every display format atomically, and deletion MUST be
rejected while any display format references that field.

#### Scenario: Rename a displayed custom field
- **WHEN** a custom field key referenced by card formats is renamed
- **THEN** all matching parsed format tokens use the new key without changing literal text

#### Scenario: Reject deletion of a displayed field
- **WHEN** any saved card format references a custom field
- **THEN** deleting that field fails without changing definitions, values, or formats
