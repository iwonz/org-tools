## MODIFIED Requirements

### Requirement: Users manage Tags centrally
The Employees header SHALL expose a Tag dialog with search, Employee count, dated-assignment count,
flat borderless rows, and confirmed deletion. Every row SHALL expose Eye, Color, Edit, and Delete
actions in that order. Edit SHALL open a dedicated rename-only modal with Save and Cancel. Color
SHALL open the shared full-spectrum picker directly from the row and SHALL persist one valid color
change per completed interaction. Deleting a definition SHALL atomically remove its assignments,
filters, and output exclusions.

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
- **WHEN** a user selects a localized named preset
- **THEN** the definition stores that semantic preset and the picker closes

#### Scenario: Reset a Tag color
- **WHEN** a user selects No color
- **THEN** the definition uses the neutral Tag treatment and the picker closes

#### Scenario: Delete an assigned Tag
- **WHEN** the user confirms deletion after seeing affected counts
- **THEN** the definition and all references disappear in one organization mutation

#### Scenario: Render flat Tag rows
- **WHEN** the Tag catalog is idle or hovered
- **THEN** its rows have no border, shadow, or resting card fill and hover does not change geometry

## ADDED Requirements

### Requirement: Tag membership is inspectable through full Employee cards
The Tag catalog SHALL provide an Eye action that opens a separate modal resolved by stable Tag ID.
The modal SHALL render every currently assigned Employee through the ordinary virtualized full-card
composition with Tag, Edit, and Delete actions. Membership changes MUST update the open list without
retaining stale Employee snapshots or scanning on scroll.

#### Scenario: View assigned Employees
- **WHEN** the Eye action opens for a Tag used by Employees
- **THEN** every current member appears as a full Employee card with standard actions on the right

#### Scenario: Remove membership while viewing
- **WHEN** an Employee loses the viewed Tag through the card action
- **THEN** that Employee disappears and the catalog count updates from current state

#### Scenario: View an unused Tag
- **WHEN** the Eye action opens for a Tag with no assignments
- **THEN** the modal shows the localized ordinary empty state without hiding the action
