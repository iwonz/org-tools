## ADDED Requirements

### Requirement: The generic editor retains six product surfaces
The application SHALL provide Units, Employees, Org Editor, Export, Analytics, and Calendar in English with Org Editor active for a blank workspace.

#### Scenario: Empty workspace navigation
- **WHEN** the workspace has no Units or Employees
- **THEN** each tab remains reachable and shows an actionable empty state

### Requirement: Main and custom Views remain independent
The editor SHALL preserve the canonical Main View, custom Views, Live Units, undo/redo, drag-and-drop, layout, and viewport isolation.

#### Scenario: Custom View edit
- **WHEN** a global Employee or Unit is edited only in a custom View
- **THEN** the Main View remains unchanged

### Requirement: Calendar and analytics use normalized birthdays
The application SHALL use nullable `MM-DD` birthdays for Calendar and birthday analytics and SHALL not expose gender fields or filters.

#### Scenario: Birthday display
- **WHEN** an Employee has a valid birthday
- **THEN** the Employee appears on the matching Calendar day and birthday aggregates
