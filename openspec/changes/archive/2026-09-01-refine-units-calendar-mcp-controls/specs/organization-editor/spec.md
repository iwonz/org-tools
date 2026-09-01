## ADDED Requirements

### Requirement: Units detail counts follow the Employee catalog pattern
The selected Unit detail pane SHALL omit the redundant direct-Employee descriptive label and SHALL
show the current Employee count in a compact line directly below search. The count SHALL update from
the current Unit membership and localized plural rules after search, assignment, edit, or deletion.

#### Scenario: Selected Unit Employee count
- **WHEN** a selected Unit contains Employees
- **THEN** one localized Employee count appears below search and no direct-Employee summary appears above the list

#### Scenario: Unit membership changes
- **WHEN** an Employee is assigned, edited, or removed while the Unit remains selected
- **THEN** the count and visible list update from current membership without a stale snapshot

### Requirement: Calendar tag dialogs use complete Employee rows
The Calendar dated-tag dialog SHALL omit its redundant event-count description and SHALL render
each matching Employee with the complete catalog row presentation and the same right-aligned Tag,
Edit, and Delete actions as ordinary Employee lists. The open dialog SHALL re-derive its rows from
current indexes after a mutation and preserve bounded scrolling.

#### Scenario: Open a populated dated-tag dialog
- **WHEN** a user opens a dated-tag group containing one or more Employees
- **THEN** no dated-tag event-count description is rendered and every Employee row exposes complete identity content and right-aligned actions

#### Scenario: Mutate an Employee from a dated-tag dialog
- **WHEN** a user tags, edits, or deletes an Employee from the open dialog
- **THEN** the dialog and Calendar re-derive their current rows and counts without stale Employee data
