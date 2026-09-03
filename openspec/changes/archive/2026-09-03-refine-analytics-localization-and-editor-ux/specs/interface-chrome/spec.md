## MODIFIED Requirements

### Requirement: Application chrome uses a restrained layered visual system
The application SHALL use a dark collapsible navigation sidebar, a compact workflow header outside
Editor, a low-contrast shell, full-bleed workflows, and restrained tonal grouping in light and dark
themes. Editor SHALL omit the shared 64 px header and use that height for its canvas. Primary,
focus, active, and semantic states SHALL retain the established utilitarian palette without remote
assets or requests.

The interface SHALL use the locally bundled Noto Sans superfamily consistently: Noto Sans for
Latin/Cyrillic, Noto Sans SC for Simplified Chinese, and Noto Sans Arabic for Arabic. A font chosen
for an image-export artifact MAY differ only inside that artifact or preview.

#### Scenario: Ordinary workflow chrome
- **WHEN** a workflow other than Editor renders in either theme
- **THEN** the shared header and full-bleed content remain visually consistent and legible

#### Scenario: Editor canvas height
- **WHEN** Editor is active
- **THEN** the shared content header is absent and the canvas owns the released height

#### Scenario: Uniform locale typography
- **WHEN** headings, body text, placeholders, native controls, portals, or template inputs render
- **THEN** the active locale's bundled Noto family member is used consistently without remote fonts

#### Scenario: Utilitarian interaction palette
- **WHEN** focus, selection, active, or hover feedback renders in either theme
- **THEN** it remains restrained, geometry-stable, and free of violet or decorative elevation

### Requirement: Navigation states are explicit and responsive
Product destinations SHALL retain accessible vertical tabs and the current order. The sidebar SHALL
initialize compact and own Import, Export, Language, and Theme actions. Language and Theme SHALL be
buttons opening separate modal dialogs rather than Select popovers. Compact actions SHALL show only
icons with localized names and direction-aware tooltips. Sidebar controls SHALL keep their existing
48 px width, 40 px height, padding, icon size, and borderless tonal interaction. The 64 px context
header SHALL remain for non-Editor workflows and their registered actions only.

#### Scenario: Runtime sidebar actions
- **WHEN** either runtime renders the sidebar
- **THEN** Import, Export, Language, and Theme share identical geometry in both sidebar modes

#### Scenario: Open settings modal
- **WHEN** Language or Theme is activated
- **THEN** its independent modal opens above workflow controls without a dropdown surface

#### Scenario: Compact tooltip over Editor
- **WHEN** a compact navigation action is hovered while Editor is active
- **THEN** its tooltip is fully visible above canvas toolbars and below any open modal

#### Scenario: Responsive and RTL shell
- **WHEN** the shell renders at maintained widths or in Arabic RTL
- **THEN** actions remain reachable, logical placement mirrors, and controls do not overflow

### Requirement: Dialogs and overlays preserve task context
Dialog and alert-dialog surfaces SHALL remain distinct through overlay, radius, focus management,
and at most one restrained shadow. Language and Theme SHALL use compact modal radio lists. Non-modal
Popover, Select, Tag/search, and Editor menus SHALL retain one neutral hairline and borderless items.
Overlay levels SHALL place canvas tools below sidebar tooltips, sidebar content below dialogs, and
runtime errors above all ordinary interaction layers.

#### Scenario: Modal setting selector
- **WHEN** Language or Theme opens over any workflow
- **THEN** the modal traps focus, shows stable radio rows, and remains above sidebar and canvas UI

#### Scenario: Non-modal dropdown separation
- **WHEN** another floating menu opens over a same-tone surface
- **THEN** one neutral outline distinguishes it without item geometry shifts

#### Scenario: Destructive alert
- **WHEN** a destructive confirmation opens
- **THEN** it remains above all ordinary controls with explicit warning and cancellation

### Requirement: Units detail panes use one compact alignment
At 768 px and wider, the Units hierarchy and Employee roster SHALL each occupy exactly half of the
workflow width. Their Unit-name and Employee searches SHALL share the same first-row vertical
position, height, and padding. Selected Unit identity, breadcrumb, and roster count SHALL follow the
right search before one contiguous Employee list. Below 768 px, the panes SHALL stack as equal-height
regions without horizontal overflow.

#### Scenario: Populated desktop Units workflow
- **WHEN** a Unit with Employees renders at desktop width
- **THEN** both panes are equal width and both searches share one horizontal baseline

#### Scenario: Narrow Units workflow
- **WHEN** Units renders below 768 px
- **THEN** the hierarchy and roster are equal-height stacked panes with reachable controls

#### Scenario: Contiguous selected-Unit roster
- **WHEN** a selected Unit contains direct and descendant Employees
- **THEN** all cards appear in one list and one summary reports total and conditional matches
