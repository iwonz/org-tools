## MODIFIED Requirements

### Requirement: Org Editor Employee geometry follows wrapped tags
The Org Editor SHALL compute Employee and open-position row heights from one measured inline layout
of text, localized Tag fragments, and assignment fragments. The same layout MUST drive virtual
offsets, hitboxes, selection, connectors, layout, bounds, DOM rendering, and PNG drawing. Tags SHALL
use compact catalog-colored decoration with complete `label · date` content. Oversized content MUST
wrap by words and then grapheme clusters into content-sized decorated fragments without ellipsis,
overflow, hidden content, or unused colored row width.

#### Scenario: Tag rows change
- **WHEN** Employee Tags, a format, width, direction, font, or locale changes the measured fragments
- **THEN** every downstream canvas geometry consumer uses the updated shared layout without overlap

#### Scenario: Large structure virtualization
- **WHEN** a large current structure contains variable-height Employee or open-position rows
- **THEN** only visible rows render while hit testing and connector anchors remain aligned with their rows

#### Scenario: Export Employee tags to PNG
- **WHEN** an Employee with dated, undated, or wider-than-column Tags is included in an Org Editor PNG export
- **THEN** PNG draws the same ordered compact fragments, padding, radii, colors, typography, gaps, and row geometry as the corresponding Editor density

### Requirement: Editor Employee rows use formatted multiline geometry
The Editor SHALL render Employee information from the persisted Editor format as one shared rich
layout containing inline Markdown runs, native Tag fragments, and compound `Position · Unit`
assignment fragments. Every line SHALL use one base text style and Markdown links SHALL remain
visually styled but non-interactive inside the single Employee-row button. DOM rows, virtual
offsets, wrapping, hit testing, anchors, Unit bounds, and PNG layout MUST consume the same layout
result with the existing row height as a minimum. Text or another semantic surface MAY precede or
follow a Tag or assignment on the same visual row. Open-position rows and Unit Tag footers SHALL use
the same compact surface metrics and fragment rules.

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
- **THEN** content-sized bordered fragments wrap in structural order and every dependent Editor geometry uses the resulting layout height

## ADDED Requirements

### Requirement: Editor Tag surfaces share two bounded densities
All Tag surfaces SHALL use the maintained normal or compact metric set. Editor Employee rows, open
positions, Unit Tag footers, and their PNG equivalents MUST use compact density; other application
surfaces MUST use normal density. The selected image font MAY replace the font family while font
size, line height, weight, padding, radius, gap, and wrapping behavior remain density-defined.

#### Scenario: Compare Editor DOM and PNG
- **WHEN** DOM and PNG use the same content, width, direction, locale, density, and font
- **THEN** their fragment order, rectangles, decoration, line gaps, row heights, Unit bounds, and anchors match

