## ADDED Requirements

### Requirement: Employee management actions share the application header
The Employees section SHALL register Employee model, Tags, and Add Employee actions in the shared
header with leading thematic icons. Narrow screens SHALL retain accessible icon-only actions and
tooltips without changing header height.

#### Scenario: Open Employee management
- **WHEN** a user activates Employee model or Tags
- **THEN** the corresponding localized modal opens without replacing the Employees workflow

### Requirement: Navigation prioritizes Employees
The sidebar SHALL order Employees before Units while preserving the existing order of Editor,
Analytics, Calendar, Data Download, and utility actions.

#### Scenario: Read the primary navigation
- **WHEN** the sidebar is expanded or compact
- **THEN** Employees is the first product section and Units is second with unchanged icon geometry
