## ADDED Requirements

### Requirement: Structured output includes custom Employee fields
Data Download and Editor JSON SHALL expose every custom field as an ordinary selectable and sortable
top-level field. The default output name SHALL be its token key and MAY be overridden with the same
nonempty collision checks as built-in fields. Value fields SHALL preserve JSON types, option values
SHALL emit labels, unset values SHALL emit null, and Template fields SHALL emit rendered text or the
configured digest.

#### Scenario: Reorder custom JSON fields
- **WHEN** a user moves built-in, collection, and custom rows
- **THEN** preview and complete JSON follow the exact stored order without a separate custom block

#### Scenario: Export an option field
- **WHEN** a selected option Value field is set on an Employee
- **THEN** JSON emits the current option label rather than the internal option UUID

### Requirement: Template output resolves the custom token graph
Both Template surfaces SHALL include every valid custom key in the shared `@` suggestions and
conditional-expression resolver. Custom dependencies SHALL be evaluated once per Employee in
topological order and SHALL use the same values and hashes in Data Download and Editor export.

#### Scenario: Insert a custom token
- **WHEN** a user chooses a custom field from the `@` menu
- **THEN** the current key is inserted and both output surfaces resolve it identically
