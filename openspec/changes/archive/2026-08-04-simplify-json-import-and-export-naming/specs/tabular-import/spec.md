## ADDED Requirements

### Requirement: JSON collections can be mapped to organization data
The application SHALL discover ordinary JSON object collections, let users choose Teams,
Employees, or Teams + Employees, map applicable entity and relation fields, and preview the
normalized append-only graph before import.

#### Scenario: JSON collection mapping
- **WHEN** a JSON value contains one or more object collections
- **THEN** the user can choose a root collection and map scalar fields plus recursive `children` and inline `employees` arrays

#### Scenario: Generic Live data
- **WHEN** ordinary JSON contains fields resembling Live rules
- **THEN** the mapper creates manual Teams only and explains that Live semantics require a recognized state

#### Scenario: Non-JSON input
- **WHEN** selected file content cannot be parsed as JSON
- **THEN** mapping is unavailable and a localized JSON parse error is shown

## REMOVED Requirements

### Requirement: CSV and JSON rows can be mapped to Employees
**Reason**: Import is now JSON-only and the replacement JSON collection requirement retains the supported generic mapping behavior.
**Migration**: Convert ordinary CSV import sources to JSON arrays or nested JSON objects before selecting them.

### Requirement: Generic CSV supports flat Team relations
**Reason**: The CSV-import and flat parent-key workflow are removed with the JSON-only import boundary.
**Migration**: Represent Team hierarchy with nested JSON `children` arrays and assignments with inline `employees` arrays.
