## REMOVED Requirements

### Requirement: The Editor owns one current structure
**Reason**: The Editor now manages one canonical system View and isolated custom structural Views.
**Migration**: The existing structure becomes the system View during the guarded local conversion.

## ADDED Requirements

### Requirement: The Editor exposes accessible View management
The Editor SHALL show a styled View Select and Create action in every canvas state. Custom Views
SHALL also expose Rename and Delete actions, while Undo/Redo remain a separate adjacent surface.
Create SHALL accept a name and either Blank or Copy with any current View as source.

#### Scenario: Manage an empty custom View
- **WHEN** an active custom View contains no Units
- **THEN** its Select, Create, Rename, and Delete controls remain available

#### Scenario: Cancel View deletion
- **WHEN** the user closes or cancels the confirmation
- **THEN** the View, active selection, Download source, and documents remain unchanged

### Requirement: Expanded Unit cards summarize direct Tags
An expanded Unit with tagged direct Employees SHALL render a compact borderless tonal footer after
its Employee list. The footer SHALL show every catalog-ordered Tag as a filled wrapping chip with its
label and unique direct-Employee count. Descendants SHALL NOT contribute. Live Units SHALL use their
resolved direct membership. Dates SHALL NOT split a Tag count. Collapsed and tagless Units SHALL have
no footer.

#### Scenario: Count manual Unit Tags
- **WHEN** direct Employees in a manual Unit share one or more Tags
- **THEN** each Tag footer chip shows the number of distinct direct Employees with that Tag

#### Scenario: Exclude descendants
- **WHEN** only Employees in descendant Units carry a Tag
- **THEN** the parent Unit footer does not show or count that Tag

#### Scenario: Wrap many Tags
- **WHEN** Tag chips exceed the Unit width
- **THEN** all chips wrap to additional rows and the Unit height, bounds, connections, and collision geometry expand by the shared measured footer height

#### Scenario: Export the footer
- **WHEN** Editor PNG is rendered for a Unit with a Tag footer
- **THEN** the same Tag labels, counts, colors, wrapping, and geometry appear in the image
