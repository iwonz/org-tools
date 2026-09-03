## ADDED Requirements

### Requirement: Flat Tag rows remain separated without hover chrome
The Tag catalog SHALL render rows with zero row padding, no border, no shadow, no permanent fill,
and no hover fill or geometry change. The list SHALL provide a consistent vertical gap between rows.

#### Scenario: Inspect the Tag catalog
- **WHEN** multiple Tags are visible and a row is hovered
- **THEN** rows remain visually separated by the list gap and the hovered row retains its transparent background and geometry

### Requirement: Tag lifecycle changes propagate across Views
Tag assignment changes SHALL update global Employees and every derived View. Tag deletion SHALL
clear global assignments, Download exclusions, Employee filters, and Live-rule references in every
View atomically.

#### Scenario: Edit a Tag in a custom View
- **WHEN** the user changes an Employee Tag from a custom View
- **THEN** the Employee and every View footer or row display the same current Tag

#### Scenario: Delete a Tag used by several Views
- **WHEN** Tag deletion is confirmed
- **THEN** no Employee, View Live rule, filter, footer, or export setting retains its ID or normalized label
