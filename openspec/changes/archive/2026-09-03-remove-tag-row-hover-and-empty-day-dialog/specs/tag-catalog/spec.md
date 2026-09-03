## MODIFIED Requirements

### Requirement: Users manage Tags centrally
The Employees header SHALL expose a Tag dialog with search, Employee count, dated-assignment count,
flat borderless rows, and confirmed deletion. Tag rows SHALL have no wrapper padding, row hover
effect, border, shadow, or resting card fill; only their explicit controls SHALL provide interaction
feedback. Every row SHALL expose Eye, Color, Edit, and Delete actions in that order. Edit SHALL open
a dedicated rename-only modal with Save and Cancel. Color SHALL open the shared full-spectrum picker
directly from the row and SHALL persist one valid color change per completed interaction. Deleting a
definition SHALL atomically remove its assignments, filters, and output exclusions.

#### Scenario: Open Tag editing
- **WHEN** a user activates Edit for a catalog Tag
- **THEN** a separate focused rename modal opens without color controls or catalog reflow

#### Scenario: Save a Tag draft
- **WHEN** a user changes the label to a unique valid value and activates Save
- **THEN** the existing Tag definition changes atomically and the edit modal closes

#### Scenario: Cancel a Tag draft
- **WHEN** a user closes or cancels the edit modal after changing its draft label
- **THEN** the Tag definition and its assignments remain unchanged

#### Scenario: Open quick color editing
- **WHEN** a user activates the Color action for a Tag
- **THEN** the shared full palette, exact input, named colors, and No color appear from that row

#### Scenario: Choose an arbitrary color
- **WHEN** a palette or hue gesture completes
- **THEN** one canonical color change is persisted and pointer samples do not create organization writes

#### Scenario: Choose a named color
- **WHEN** a user selects a localized named preset below the palette
- **THEN** the definition stores that semantic preset and the picker closes

#### Scenario: Reset a Tag color
- **WHEN** a user selects No color
- **THEN** the definition uses the neutral Tag treatment and the picker closes

#### Scenario: Delete an assigned Tag
- **WHEN** the user confirms deletion after seeing affected counts
- **THEN** the definition and all references disappear in one organization mutation

#### Scenario: Render flat Tag rows
- **WHEN** the Tag catalog row is idle or the pointer is over its non-control area
- **THEN** the row has zero wrapper padding and no border, shadow, resting fill, hover fill, or geometry change
