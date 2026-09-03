## MODIFIED Requirements

### Requirement: Dialogs and overlays preserve task context
Dialog and alert-dialog surfaces SHALL remain distinct through overlay, radius, focus management,
and at most one restrained shadow. Language and Theme SHALL use compact modal radio lists. Non-modal
Popover, Select, Tag/search, and Editor menus SHALL retain one neutral hairline and borderless items.
Overlay levels SHALL place canvas tools below sidebar tooltips, sidebar content below dialogs,
Popovers above their owning dialog, nested Select portals above Popovers, and runtime errors above
all ordinary interaction layers. Headers, scrollable bodies, and footers SHALL use consistent
spacing and restrained tonal separation when it keeps actions or context visible.

#### Scenario: Modal setting selector
- **WHEN** Language or Theme opens over any workflow
- **THEN** the modal traps focus, shows stable radio rows, and remains above sidebar and canvas UI

#### Scenario: State Import dialog
- **WHEN** a valid or invalid state file is selected at a 390 px viewport
- **THEN** its compact summary or owned error and actions remain readable without horizontal overflow

#### Scenario: Destructive alert
- **WHEN** a destructive confirmation opens
- **THEN** overlay, warning copy, destructive action, and cancellation remain explicit in both
  themes

#### Scenario: Dropdown separation
- **WHEN** any non-modal floating menu opens over a same-tone page in either theme
- **THEN** one stable neutral outline distinguishes the container without an item border, geometry
  shift, or additional elevation

#### Scenario: Select inside a Popover
- **WHEN** the exact Tag color type Select opens inside the color Popover
- **THEN** every option renders above the Popover and remains pointer and keyboard accessible

### Requirement: Units detail panes use one compact alignment
At 768 px and wider, the Units hierarchy and Employee roster SHALL each occupy exactly half of the
workflow width. Their Unit-name and Employee searches SHALL share the same first-row vertical
position, height, and padding. The complete roster count and conditional filtered match count SHALL
appear immediately below the right search on its logical content edge; selected Unit identity and
breadcrumb SHALL follow before one contiguous Employee list. Below 768 px, the panes SHALL stack as
equal-height regions without horizontal overflow. The hierarchy SHALL begin directly at the
workflow content boundary, and search, count, breadcrumbs, and Employee rows SHALL share one logical
content edge.

#### Scenario: Populated desktop Units workflow
- **WHEN** a Unit with Employees renders at desktop width
- **THEN** both panes are equal width and both searches share one horizontal baseline

#### Scenario: Narrow Units workflow
- **WHEN** Units renders below 768 px
- **THEN** the hierarchy and roster are equal-height stacked panes with reachable controls

#### Scenario: Populated Units workflow alignment
- **WHEN** a Unit with Employees is selected at a maintained desktop width
- **THEN** its roster count is directly below Employee search and above Unit identity and breadcrumbs

#### Scenario: Contiguous selected-Unit roster
- **WHEN** a selected Unit contains both direct and descendant Employees
- **THEN** all matching Employee cards appear in one contiguous list without direct or descendant section headings
- **AND** one summary below search reports the complete total and conditional filtered match count
