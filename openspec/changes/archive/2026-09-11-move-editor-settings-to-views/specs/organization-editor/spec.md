## REMOVED Requirements

### Requirement: Unit settings control contiguous Tag grouping
**Reason**: Presentation settings now belong to the whole View.
**Migration**: Replace Unit groupByTag with View structure.settings and use the View toolbar dialog.

## ADDED Requirements

### Requirement: View settings control Unit presentation
Every View SHALL expose a toolbar settings gear opening Unit display and Distribution mode sections.
Unit display SHALL offer Group by tag and Show Tag cloud switches, both enabled by default. Unit
cards MUST NOT retain a settings gear; their note action SHALL occupy the free upper corner.
Each change SHALL apply immediately as one View-local undoable command. Closing the dialog SHALL
restore focus; changing or deleting its View SHALL close it safely.

#### Scenario: Configure an empty or system View
- **WHEN** the active View is system, custom, or empty
- **THEN** its accessible toolbar settings action remains available

#### Scenario: Group all Units
- **WHEN** View grouping is enabled
- **THEN** every manual and Live Unit shows its boss once first, then Employees grouped once by earliest catalog Tag, with stable full-name/ID order within groups and untagged Employees last without separators

#### Scenario: Disable grouping
- **WHEN** View grouping is disabled
- **THEN** every Unit shows its boss first followed by one stable alphabetic list and one Undo restores grouping

#### Scenario: Share row order
- **WHEN** grouping changes or the Tag catalog is reordered
- **THEN** canvas, PNG, virtualization, navigation, and distribution anchors use the same resulting row sequence

## MODIFIED Requirements

### Requirement: Expanded Unit cards summarize direct Tags
An expanded Unit with tagged direct Employees and enabled View Tag cloud visibility SHALL render a compact borderless tonal footer after
its Employee list. The footer SHALL show every catalog-ordered Tag as a filled wrapping chip with its
complete label and unique direct-Employee count. Short chips SHALL be content-sized with equal
compact insets. A long chip SHALL use no more than the footer width, wrap by words and then grapheme
clusters, and keep the `middle dot + count` suffix unbroken on the last fitting line or its own line.
Ellipsis MUST NOT be used. One deterministic shared layout SHALL drive DOM rendering, PNG rendering,
Unit height, bounds, connections, spatial indexing, snapping, and collision geometry. Descendants
SHALL NOT contribute. Live Units SHALL use their resolved direct membership. Dates SHALL NOT split a
Tag count. Collapsed and tagless Units, and all Units in a View with Tag cloud visibility disabled, SHALL have no footer or reserved footer height.

#### Scenario: Count manual Unit Tags
- **WHEN** direct Employees in a manual Unit share one or more Tags
- **THEN** each Tag footer chip shows the number of distinct direct Employees with that Tag

#### Scenario: Exclude descendants
- **WHEN** only Employees in descendant Units carry a Tag
- **THEN** the parent Unit footer does not show or count that Tag

#### Scenario: Size chips by content
- **WHEN** footer Tags have labels and counts of different lengths
- **THEN** every short chip uses the same compact insets and only the width required by its own content

#### Scenario: Wrap a long multilingual Tag
- **WHEN** a Latin, Cyrillic, Arabic, CJK, or emoji Tag is wider than the footer
- **THEN** its complete label wraps without an ellipsis and its count suffix remains indivisible

#### Scenario: Wrap many Tags
- **WHEN** measured Tag chips exceed the Unit width
- **THEN** all chips wrap to additional rows and the Unit height, bounds, connections, and collision geometry expand by the shared measured footer height

#### Scenario: Export the footer
- **WHEN** Editor PNG is rendered for a Unit with a Tag footer
- **THEN** the same complete Tag labels, counts, colors, compact widths, line wrapping, and geometry appear in the image

#### Scenario: Hide the View Tag cloud
- **WHEN** Show Tag cloud is disabled
- **THEN** every canvas and PNG Unit omits its footer and uses zero footer height while Employee Tags and counts remain unchanged
