## ADDED Requirements

### Requirement: Editor export shares structured output behavior
The Editor export dialog SHALL offer Image, JSON, and Template formats. JSON and Template SHALL use
the same schemas, validation, naming, tokens, fixed Unit-path separator, bounded previews, and local
generation behavior as Data Download while retaining independent session-local settings. The
selected Unit-only or subtree scope SHALL determine both the Employees and the Unit assignments
available to structured output; assignments outside that scope MUST NOT appear.

#### Scenario: Export scoped JSON
- **WHEN** a user exports JSON for one Unit or a subtree
- **THEN** each scoped Employee appears once and contains only retained assignments inside the selected scope

#### Scenario: Exclude every scoped assignment
- **WHEN** exclusions remove every scoped Unit assignment for an otherwise included Employee
- **THEN** the Employee remains and the enabled Unit collection is an empty array

#### Scenario: Export a scoped template
- **WHEN** a scoped Employee belongs to multiple scoped Units and the user selects a Template row mode
- **THEN** the common Template formatter produces All Units or First Unit rows from only that scope

#### Scenario: Preserve image export
- **WHEN** the user selects Image
- **THEN** the existing local PNG preview, customization, copy, and save behavior remains available
