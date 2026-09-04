## ADDED Requirements

### Requirement: Employee placement navigation preserves Editor interaction geometry
The Editor SHALL compose a multi-placement Employee row from a primary drag/select button and a
separate fixed-size placement action. The action and its transient map MUST NOT change Employee row
height, Unit bounds, snapping, spatial indexes, hierarchy connections, report output, or drag
behavior. Navigation SHALL reuse the Editor's exact Employee occurrence reveal and centering flow.

#### Scenario: Render a placement action
- **WHEN** a visible Employee belongs to more than one direct Unit
- **THEN** the row retains its deterministic height and exposes a separate action at the logical end

#### Scenario: Activate the row action
- **WHEN** the placement action receives pointer or keyboard activation
- **THEN** it opens the map without selecting, dragging, or opening the Employee context menu

#### Scenario: Center a collapsed occurrence
- **WHEN** placement navigation targets an Employee hidden by a collapsed Unit
- **THEN** the Unit expands before the exact row is selected and centered
