# interface-chrome Specification

## Purpose
Define how the application separates shell, surface, dialog, and repeated-row content without
unnecessary decorative rules.

## Requirements
### Requirement: Application chrome is separated without decorative rules
The application SHALL use one borderless 56 px header, a continuous theme-aware neutral shell
background, spacing, background grouping, and control layout instead of decorative horizontal rules
in the main shell, status bands, product surface headers, and local section headers. The header
SHALL contain a horizontally containable product-tab region on the left and a fixed global-action
region on the right. The product-tab region SHALL form one contiguous bordered island with no gap or
individual control border between tabs. The active tab SHALL use a tab-specific inset indicator and
stronger text without a filled action-button background. The root shell, transparent header, and all
six top-level product surfaces SHALL share the shell background, while meaningful cards, fields,
dialogs, popovers, calendar cells, and interactive controls retain their own bounded surface
treatment.

#### Scenario: Populated product surface
- **WHEN** a populated product surface renders below the unified app header
- **THEN** the header and surface share one continuous shell background without a separate tab row, white header strip, shadow, or horizontal divider line

#### Scenario: Contiguous product tab island
- **WHEN** the unified header renders in light or dark theme
- **THEN** one outer boundary groups all six equal-height product tabs with no gap or individual tab border
- **AND** the active tab has stronger text and a visible inset bottom indicator while retaining a transparent background

#### Scenario: Status band
- **WHEN** an error or informational status appears
- **THEN** its owned background and text treatment distinguish it without a bottom rule

#### Scenario: Responsive header containment
- **WHEN** the application renders at 390, 1024, or 1280 px wide
- **THEN** global actions remain reachable, tab overflow remains inside its navigation region, and the page has no horizontal overflow

#### Scenario: Meaningful surface contrast
- **WHEN** the continuous shell renders in light or dark theme
- **THEN** cards, fields, dialogs, popovers, calendar cells, and interactive controls remain visually distinct from the shell without adding a header separator

### Requirement: Dialog chrome is borderless inside its outer boundary
Dialog and alert-dialog headers and footers SHALL use padding and background without internal top or
bottom rules while preserving accessible titles, descriptions, close actions, scrolling, and
confirmation actions.

#### Scenario: Long dialog
- **WHEN** Import, Export, or Employee content scrolls inside a constrained dialog
- **THEN** the header and actions remain readable and reachable without header or footer divider lines

#### Scenario: Destructive alert
- **WHEN** a destructive confirmation dialog opens
- **THEN** its destructive copy and action remain explicit without internal dialog rules

### Requirement: Repeated rows are separated without line rules
Repeated interface rows SHALL use spacing and interaction feedback instead of decorative line
rules. This applies to virtualized and non-virtualized filters, tag pickers, mappings, event lists,
and import previews.

#### Scenario: Interactive option list
- **WHEN** a user navigates a filter or tag list with pointer or keyboard
- **THEN** each option remains identifiable from layout and active feedback without a row divider

#### Scenario: Mapping and preview rows
- **WHEN** a generic mapping or structured preview contains multiple rows
- **THEN** aligned fields, hierarchy, cards, and spacing remain readable without repeated row rules

### Requirement: Meaningful component boundaries remain
The application SHALL retain outlines that communicate interactive controls, selectable cards,
dialogs, calendar cells, independent split panes, hierarchy guides, focus, errors, or destructive
states.

#### Scenario: Interactive boundary audit
- **WHEN** the borderless chrome is rendered in light or dark theme
- **THEN** fields, choice cards, calendar cells, split panes, hierarchy guides, focus rings, and destructive selections remain visually bounded

#### Scenario: Narrow layout
- **WHEN** the Import dialog renders at a 390 px viewport
- **THEN** operation cards stack, content remains inside the dialog, and no page-level horizontal overflow appears
