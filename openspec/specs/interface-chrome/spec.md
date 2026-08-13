# interface-chrome Specification

## Purpose
Define how the application separates shell, surface, dialog, and repeated-row content without
unnecessary decorative rules.
## Requirements
### Requirement: Application chrome is separated without decorative rules
The application SHALL use one borderless 56 px header and one continuous root surface: white in the
light theme and a shared dark neutral in the dark theme. Every product workflow SHALL begin flush
with the bottom edge of that header without a tab-specific outer top inset, and the first visible
root-level content group in every populated product tab SHALL add no top margin or padding, so
switching between the Editor canvas and ordinary content does not shift the workflow or its leading
content downward. It SHALL use whitespace, typography, alignment, and interaction feedback instead
of bordered, rounded, or filled layout islands and instead of decorative horizontal rules in the
main shell, status bands, product surface headers, and local section headers. The header SHALL
contain a horizontally containable product-tab region on the left and a fixed global-action region
on the right. Product tabs SHALL render as a flat, spaced group without a shared boundary,
persistent fill, underline, or active font-weight change; the active tab SHALL use foreground color
alone. Every nested tab group SHALL use the same flat treatment. Language, theme, Import, and Export
controls SHALL render as a flat, spaced group without a shared enclosing surface. Populated
Employees, Teams, Analytics, Calendar, and Download SHALL place their headers, controls, panes,
lists, and sections directly on the continuous root surface without an outer rounded workflow
container or nested decorative section fills. Teams and Download SHALL separate adjacent source and
Employee panes through compact layout and grouping without a vertical rule. Meaningful fields,
dialogs, popovers, selectable and destructive choices, calendar cells, focus and error states,
hierarchy guides, data objects whose boundary communicates identity, and the two floating Editor
toolbar groups SHALL retain their required bounded treatment.

#### Scenario: Continuous white light surface
- **WHEN** any product workflow renders in the light theme
- **THEN** the transparent header, top-level workflow, ordinary sections, and repeated list surface share one uninterrupted white background beginning at the same vertical boundary
- **AND** no contrasting page strip, top inset, divider, shadow, rounded workflow boundary, or decorative section fill fragments the page

#### Scenario: Continuous dark surface
- **WHEN** any product workflow renders in the dark theme
- **THEN** the header and ordinary workflow content share one uninterrupted dark neutral background
- **AND** semantic controls and content remain readable without recreating light or dark layout islands

#### Scenario: Flat product tabs
- **WHEN** the unified header renders in light or dark theme
- **THEN** all six equal-height product tabs appear in one spaced flat row without a shared boundary or persistent container fill
- **AND** the active tab uses foreground color without an underline, font-weight change, button-like fill, individual border, or enclosing pill

#### Scenario: Consistent flat nested tabs
- **WHEN** a tab group renders in Download, a dialog, or another product workflow
- **THEN** its triggers use the same spaced flat treatment and the selected trigger is identified by foreground color without a font-weight change, shared segmented boundary, or persistent fill

#### Scenario: Flat global actions
- **WHEN** the unified header renders its global controls
- **THEN** language, theme, Import, and Export appear as a spaced flat group without a shared enclosing border, radius, or fill
- **AND** hover, focus, open, and disabled states remain visible for each control

#### Scenario: Adjacent product panes
- **WHEN** populated Teams or Download renders its source pane beside an Employee pane
- **THEN** the panes remain identifiable from compact layout, headings, and owned interactive content without a vertical separator rule or enclosing pane fill
- **AND** the seam does not introduce an empty decorative gutter

#### Scenario: Flat Analytics layout
- **WHEN** populated Analytics renders its six groups in light or dark theme
- **THEN** every group sits directly on the root surface without an outer border, shadow, radius, or nested background fill
- **AND** compact grid gaps, headings, columns, scrolling, and hover or focus feedback preserve structure without horizontal rules

#### Scenario: Status band
- **WHEN** an error or informational status appears
- **THEN** its semantic feedback background and text distinguish it without a bottom rule

#### Scenario: Responsive header containment
- **WHEN** the application renders at 390, 1024, or 1280 px wide
- **THEN** global actions remain reachable, tab overflow remains inside its navigation region, and the page has no horizontal overflow

#### Scenario: Meaningful surface contrast
- **WHEN** the flat interface renders in light or dark theme
- **THEN** fields, dialogs, popovers, selectable choices, calendar cells, Editor data nodes and toolbar groups, and interactive states remain visually distinct without restoring layout islands to ordinary workflows

#### Scenario: Stable product workflow origin
- **WHEN** a user switches between Editor and any populated product workflow
- **THEN** the Editor canvas, ordinary workflow surface, and its first visible root-level content group all begin immediately below the unified header without outer top margin, top padding, or a vertical content jump

### Requirement: Tabs use color-only pointer feedback
Product and nested tab triggers SHALL keep a transparent background when the pointer hovers them and
SHALL communicate hover through foreground color without adding a fill, border, underline, shadow,
font-weight change, or layout shift. Focus rings, active color, disabled state, and keyboard
navigation SHALL remain available.

#### Scenario: Product tab hover
- **WHEN** the pointer hovers an inactive product tab in either theme
- **THEN** the tab foreground changes while its background remains transparent
- **AND** its dimensions, border, font weight, and neighboring tab positions do not change

#### Scenario: Nested tab hover
- **WHEN** the pointer hovers an inactive nested tab in Download, a dialog, or another workflow
- **THEN** the trigger uses the same foreground-only feedback and retains a transparent background

#### Scenario: Keyboard focus
- **WHEN** a user focuses or activates a tab with the keyboard
- **THEN** the focus ring, color-based active state, and standard tab navigation remain available without a hover fill

### Requirement: Dialog chrome is borderless inside its outer boundary
Dialog and alert-dialog outer boundaries SHALL remain visually distinct from the page, while their
headers and footers SHALL use padding and background without internal top or bottom rules. Accessible
titles, descriptions, close actions, scrolling, and confirmation actions SHALL remain unchanged.

#### Scenario: Long dialog
- **WHEN** Import, Export, or Employee content scrolls inside a constrained dialog
- **THEN** the outer dialog remains identifiable and the header and actions remain readable and reachable without header or footer divider lines

#### Scenario: Destructive alert
- **WHEN** a destructive confirmation dialog opens
- **THEN** its outer boundary, destructive copy, and action remain explicit without internal dialog rules

### Requirement: Repeated rows are separated without line rules
Repeated interface rows SHALL use compact content layout and interaction feedback instead of
decorative line rules, card fill, or inter-row gutters. Virtualized Employee lists SHALL render
contiguous rows directly on the workflow background without individual list-row corner rounding.
This applies alongside virtualized and non-virtualized filters, tag pickers, mappings, event lists,
and import previews, except where a real selectable or data-card boundary is semantically required.

#### Scenario: Interactive option list
- **WHEN** a user navigates a filter or tag list with pointer or keyboard
- **THEN** each option remains identifiable from layout and active feedback without a row divider or persistent row fill

#### Scenario: Contiguous Employee list
- **WHEN** multiple Employees render in a list surface
- **THEN** adjacent rows share the root surface without an inter-row gap, individual background tile, corner rounding, or row divider

#### Scenario: Mapping and preview rows
- **WHEN** a generic mapping or structured preview contains multiple rows
- **THEN** aligned fields, hierarchy, semantic cards, and spacing remain readable without decorative repeated row rules or section islands

### Requirement: Meaningful component boundaries remain
The application SHALL retain outlines or owned surfaces only when they communicate interactive
controls, selectable cards, dialogs, popovers, calendar cells, hierarchy guides, canvas data nodes,
focus, errors, or destructive states. Adjacent Teams and Download panes, workflow wrappers,
navigation groups, toolbar groups, ordinary repeated rows, and Analytics groups SHALL not use an
outline or fill solely as layout decoration.

#### Scenario: Semantic boundary audit
- **WHEN** the flat chrome is rendered in light or dark theme
- **THEN** fields, choice cards, dialogs, popovers, calendar cells, hierarchy guides, Editor data nodes, focus rings, and destructive selections remain visually bounded
- **AND** navigation, actions, workflow wrappers, Analytics sections, and ordinary rows remain unenclosed

#### Scenario: Narrow layout
- **WHEN** the Import dialog renders at a 390 px viewport
- **THEN** operation cards retain their selectable boundaries, content remains inside the dialog, and no page-level horizontal overflow appears
