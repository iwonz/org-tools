## MODIFIED Requirements

### Requirement: Expanded Unit cards summarize direct Tags
An expanded Unit with tagged direct Employees SHALL render a compact borderless tonal footer after
its Employee list. The footer SHALL show every catalog-ordered Tag as a filled wrapping chip with its
label and unique direct-Employee count. Each chip SHALL be content-sized from one deterministic
shared text metric with equal compact horizontal insets and SHALL NOT reserve a fixed trailing area
beyond its label and count. Descendants SHALL NOT contribute. Live Units SHALL use their resolved
direct membership. Dates SHALL NOT split a Tag count. Collapsed and tagless Units SHALL have no
footer.

#### Scenario: Count manual Unit Tags
- **WHEN** direct Employees in a manual Unit share one or more Tags
- **THEN** each Tag footer chip shows the number of distinct direct Employees with that Tag

#### Scenario: Exclude descendants
- **WHEN** only Employees in descendant Units carry a Tag
- **THEN** the parent Unit footer does not show or count that Tag

#### Scenario: Size chips by content
- **WHEN** footer Tags have labels and counts of different lengths
- **THEN** every chip uses the same compact insets and only the width required by its own content

#### Scenario: Wrap many Tags
- **WHEN** measured Tag chips exceed the Unit width
- **THEN** all chips wrap to additional rows and the Unit height, bounds, connections, and collision geometry expand by the shared measured footer height

#### Scenario: Export the footer
- **WHEN** Editor PNG is rendered for a Unit with a Tag footer
- **THEN** the same Tag labels, counts, colors, compact widths, wrapping, and geometry appear in the image
