# tag-catalog Specification

## Purpose
Define stable global Tag definitions, catalog management, colored assignments, and reference cleanup.

## Requirements

### Requirement: Tags use stable catalog definitions
The system SHALL persist Tags as UUID-keyed global definitions with a unique normalized label and an
optional fixed palette color. Employee assignments SHALL reference Tag IDs and retain only an
optional exact date. Unassigned definitions SHALL remain until explicitly deleted.

#### Scenario: Rename a Tag
- **WHEN** a Tag receives a new unique label
- **THEN** every Employee assignment retains the same Tag ID and displays the new label

#### Scenario: Reject a duplicate label
- **WHEN** a label matches another Tag after Unicode normalization and case-folding
- **THEN** the change is rejected without merging definitions or assignments

### Requirement: Users manage Tags centrally
The Employees header SHALL expose a Tag dialog with search, label, palette color, Employee count,
dated-assignment count, rename, color reset, and confirmed deletion. Deleting a definition SHALL
atomically remove its assignments, filters, and output exclusions.

#### Scenario: Change a Tag color
- **WHEN** a user selects a palette color or no color in the Tag dialog
- **THEN** every Tag chip reflects that global choice after the normal state write

#### Scenario: Delete an assigned Tag
- **WHEN** the user confirms deletion after seeing affected counts
- **THEN** the definition and all references disappear in one organization mutation

### Requirement: Assignment controls reflect catalog colors
Every Tag assignment control SHALL display the current global color but SHALL edit color only in the
central Tag dialog. A new Tag staged in an Employee form SHALL use no color and SHALL enter the
catalog only when the Employee save succeeds.

#### Scenario: Cancel a new staged Tag
- **WHEN** a user creates a draft Tag and cancels the Employee form
- **THEN** neither the catalog nor the Employee is changed
