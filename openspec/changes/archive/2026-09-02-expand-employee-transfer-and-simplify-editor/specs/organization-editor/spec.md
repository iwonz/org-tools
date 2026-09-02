## MODIFIED Requirements

### Requirement: The generic editor retains six product surfaces
The application SHALL provide localized Units, Employees, Editor, Analytics, Calendar, and Download
surfaces in that order. The populated Editor SHALL place layout, hierarchy, and search controls in
one compact top-left toolbar and viewport controls in one compact bottom-left toolbar. It SHALL NOT
show a View selector, View name, create, rename, or delete actions. Editor and Units SHALL always
operate on the same current Unit structure.

#### Scenario: Current structure Editor
- **WHEN** the Editor opens with Units
- **THEN** it renders the same current Unit structure used by Units and Download without a View control

#### Scenario: Empty Editor
- **WHEN** the current structure has no Units
- **THEN** the Editor shows one add-to-canvas action without View management

#### Scenario: Editor controls
- **WHEN** current Units exist
- **THEN** layout, arrange, hierarchy, and Search remain in the top-left toolbar and zoom controls remain bottom-left

### Requirement: The Editor owns one current structure
The Editor SHALL preserve Live Units, undo/redo, drag-and-drop, layout, adaptive grid, transient
gesture previews, viewport, selection, search, templates, and PNG output for one current structure.
Custom Views, local View Employees, overrides, View switching, and View management SHALL NOT exist.

#### Scenario: Edit current structure
- **WHEN** a Unit or global Employee assignment is edited in Editor
- **THEN** Units, Analytics, Calendar, and Download observe the same current organization change

#### Scenario: Durable Editor UI
- **WHEN** selection or viewport changes
- **THEN** the single `ui.editor` projection stores it without serializing organization data

## REMOVED Requirements

### Requirement: Main and custom Views remain independent
**Reason**: Org Tools now owns one current organization structure rather than independent planning Views.

**Migration**: The owned database's sole Main document becomes `organization.structure`; custom View contracts and controls are removed.

### Requirement: Canonical and custom Views have a safe management lifecycle
**Reason**: There are no user-selectable Views to manage.

**Migration**: Use the one current Editor structure directly.
