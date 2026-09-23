## RENAMED Requirements

- FROM: `### Requirement: Editor Tag surfaces share two bounded densities`
- TO: `### Requirement: Editor Tag surfaces share one bounded contract`

## MODIFIED Requirements

### Requirement: Expanded Unit cards summarize direct Tags
An expanded Unit with tagged direct Employees and enabled View Tag cloud visibility SHALL render a
compact borderless tonal footer after its Employee list. The footer SHALL show every catalog-ordered
Tag as a filled wrapping chip with its complete label and unique direct-Employee count. Short chips
SHALL be content-sized with the universal 8 pixel inline inset. A long chip SHALL use no more than
the footer width, wrap by words and then grapheme clusters, and keep the `middle dot + count` suffix
unbroken on the last fitting fragment or its own fragment with exactly 8 pixels after the measured
content. Ellipsis MUST NOT be used. One actual-font-measured shared layout with 6 pixel row and
column gaps SHALL drive DOM rendering, PNG rendering, Unit height, bounds, connections, spatial
indexing, snapping, and collision geometry. Descendants SHALL NOT contribute. Live Units SHALL use
their resolved direct membership. Dates SHALL NOT split a Tag count. Collapsed and tagless Units,
and all Units in a View with Tag cloud visibility disabled, SHALL have no footer or reserved footer
height.

#### Scenario: Count manual Unit Tags
- **WHEN** direct Employees in a manual Unit share one or more Tags
- **THEN** each Tag footer chip shows the number of distinct direct Employees with that Tag

#### Scenario: Exclude descendants
- **WHEN** only Employees in descendant Units carry a Tag
- **THEN** the parent Unit footer does not show or count that Tag

#### Scenario: Size chips by content
- **WHEN** footer Tags have labels and counts of different lengths
- **THEN** every short chip uses the universal insets and only the width required by its own content

#### Scenario: Wrap a long multilingual Tag
- **WHEN** a Latin, Cyrillic, Arabic, CJK, or emoji Tag is wider than the footer
- **THEN** its complete label wraps without an ellipsis and its count suffix remains indivisible

#### Scenario: Wrap many Tags
- **WHEN** measured Tag chips exceed the Unit width
- **THEN** all chips wrap at 6 pixel gaps and the Unit height, bounds, connections, and collision geometry expand by the shared measured footer height

#### Scenario: Export the footer
- **WHEN** Editor PNG is rendered for a Unit with a Tag footer
- **THEN** the same complete Tag labels, counts, colors, universal widths, line wrapping, and geometry appear in the image

#### Scenario: Hide the View Tag cloud
- **WHEN** Show Tag cloud is disabled
- **THEN** every canvas and PNG Unit omits its footer and uses zero footer height while Employee Tags and counts remain unchanged

### Requirement: Org Editor Employee geometry follows wrapped tags
The Org Editor SHALL compute Employee and open-position row heights from one actual-font-measured
inline layout of text, localized Tag fragments, and assignment fragments. The same layout MUST drive
virtual offsets, hitboxes, selection, connectors, layout, bounds, DOM rendering, and PNG drawing.
Tags SHALL use the one catalog-colored decoration with complete `label · date` content. Oversized
content MUST wrap by words and then grapheme clusters into content-sized decorated fragments without
ellipsis, overflow, hidden content, or unused colored row width.

#### Scenario: Tag rows change
- **WHEN** Employee Tags, a format, width, direction, font, or locale changes the measured fragments
- **THEN** every downstream canvas geometry consumer uses the updated shared layout without overlap

#### Scenario: Large structure virtualization
- **WHEN** a large current structure contains variable-height Employee or open-position rows
- **THEN** only visible rows render while hit testing and connector anchors remain aligned with their rows

#### Scenario: Export Employee tags to PNG
- **WHEN** an Employee with dated, undated, counted, or wider-than-column Tags is included in an Org Editor PNG export
- **THEN** PNG draws the same ordered fragments, padding, radii, colors, typography, gaps, and row geometry as Editor DOM for the selected image font

### Requirement: Editor Employee rows use formatted multiline geometry
The Editor SHALL render Employee information from the persisted Editor format as one shared rich
layout containing inline Markdown runs, native Tag fragments, and compound `Position · Unit`
assignment fragments. Every line SHALL use one base text style and Markdown links SHALL remain
visually styled but non-interactive inside the single Employee-row button. DOM rows, virtual
offsets, wrapping, hit testing, anchors, Unit bounds, and PNG layout MUST consume the same
actual-font-measured layout result with the existing row height as a minimum. Text or another
semantic surface MAY precede or follow a Tag or assignment on the same visual row. Open-position
rows and Unit Tag footers SHALL use the same universal surface metrics and fragment rules.

#### Scenario: Render a rich multiline Editor Employee
- **WHEN** an Editor format produces marked text plus wrapping Tag or assignment content
- **THEN** the row, containing Unit, anchors, hit targets, and connections expand to the shared calculated geometry

#### Scenario: Collapse a Unit with a formatted boss
- **WHEN** a Unit is collapsed and its boss format produces multiple rich lines
- **THEN** the visible boss row retains the same content, marks, fragments, and calculated row bounds

#### Scenario: Render an Editor link
- **WHEN** an Editor format contains an explicit safe Markdown link, including a `mailto:` link
- **THEN** its label has link styling while the Employee row remains one button with no nested navigation element

#### Scenario: Continue after a semantic field
- **WHEN** text, Tags, assignments, and more text fit on one visual row
- **THEN** they retain source order on that row instead of forcing separate semantic blocks

#### Scenario: Wrap several assignments
- **WHEN** `{positions}` produces assignments or one assignment wider than the available row
- **THEN** content-sized bordered fragments wrap in structural order with 6 pixel continuation gaps and every dependent Editor geometry uses the resulting layout height

### Requirement: Editor Tag surfaces share one bounded contract
All Tag surfaces SHALL use an 11 pixel font, 16 pixel line height, 8 pixel inline padding, 2 pixel
block padding, 6 pixel radius, and 6 pixel horizontal and vertical gaps. Editor Employee rows, open
positions, Unit Tag footers, and PNG equivalents MUST use the same values as every other application
surface. The selected image font MAY replace only the font family; measurement MUST use that actual
font while every other metric remains fixed.

#### Scenario: Compare Editor DOM and PNG
- **WHEN** DOM and PNG use the same content, width, direction, locale, and font
- **THEN** their fragment order, measured rectangles, decoration, semantic gaps, row heights, Unit bounds, and anchors match

#### Scenario: Compare Editor with application Tags
- **WHEN** the same Tag is visible in an application control and an Editor row or Unit footer
- **THEN** font size, line height, padding, radius, and collection gaps are identical

### Requirement: Employee visual rows share exact vertical spacing
The list DOM, Editor DOM geometry, and Editor PNG renderer SHALL consume the same measured visual-row
layout for Employee formats. A boundary that continues a Tag or assignment flow MUST insert exactly
6 pixels. Every authored, blank, conditionally resolved, or ordinary text-wrap boundary MUST insert
the configured integer format gap. Total height MUST equal the sum of row heights and its explicit
internal boundary gaps without outer spacing. Unit bounds, virtual heights, hit testing, and
connection anchors MUST use that same result without line-height inflation or negative compensation.

#### Scenario: Render one row
- **WHEN** one Employee resolves to one visual row and its line gap changes between 0, 4, and 24
- **THEN** the DOM and PNG row height, Unit bounds, and connection anchors do not change

#### Scenario: Render wrapped text rows
- **WHEN** ordinary Employee text or authored blank lines produce several visual rows
- **THEN** DOM and PNG add the configured format gap exactly once between adjacent rows

#### Scenario: Render wrapped semantic rows
- **WHEN** Tags or assignments continue onto another visual row
- **THEN** DOM and PNG add exactly 6 pixels at each semantic continuation boundary regardless of the configured format gap

#### Scenario: Preserve collapsed Unit geometry
- **WHEN** a Unit with multi-row Employee content is collapsed and expanded
- **THEN** its hidden and visible bounds, hit targets, and anchors derive from the same shared row measurements
