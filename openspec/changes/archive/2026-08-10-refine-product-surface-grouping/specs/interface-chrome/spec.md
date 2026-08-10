## MODIFIED Requirements

### Requirement: Application chrome is separated without decorative rules
The application SHALL use one borderless 56 px header, a continuous theme-aware neutral shell
background, spacing, background grouping, and control layout instead of decorative horizontal rules
in the main shell, status bands, product surface headers, and local section headers. The header
SHALL contain a horizontally containable product-tab region on the left and a fixed global-action
region on the right. The product-tab region SHALL form one contiguous bordered island with no gap or
individual control border between tabs. The active tab SHALL use a flat, subtle selected-segment
fill and stronger text without an underline, individual border, or individual radius. Every nested
tab group SHALL use the same segmented-switcher treatment with one shared boundary, contiguous
triggers, and a flat selected segment. The language, theme, Import, and Export controls SHALL form a
second contiguous bordered island with one shared surface, no gaps, and no individual outer borders.
Teams and Download SHALL separate adjacent source and Employee panes through layout and grouping
without a vertical rule. Analytics SHALL group each sortable list on a quiet, borderless card
surface. The root shell, transparent header, and all six top-level product surfaces SHALL share the
shell background, while meaningful cards, fields, dialogs, popovers, calendar cells, and interactive
controls retain their own bounded surface treatment.

#### Scenario: Populated product surface
- **WHEN** a populated product surface renders below the unified app header
- **THEN** the header and surface share one continuous shell background without a separate tab row, white header strip, shadow, or horizontal divider line

#### Scenario: Contiguous product tab island
- **WHEN** the unified header renders in light or dark theme
- **THEN** one outer boundary groups all six equal-height product tabs with no gap or individual tab border
- **AND** the active tab has stronger text and a subtle flat fill without an underline, individual border, or individual radius

#### Scenario: Consistent nested switcher
- **WHEN** a tab group renders in Download, a dialog, or another product workflow
- **THEN** one shared boundary groups contiguous square-edged triggers and the selected trigger uses the same flat filled segment treatment

#### Scenario: Contiguous global-action island
- **WHEN** the unified header renders its global controls
- **THEN** one outer boundary groups language, theme, Import, and Export at equal height with no gap or individual outer border
- **AND** hover, focus, and open states remain visible within the shared island

#### Scenario: Adjacent product panes
- **WHEN** populated Teams or Download renders its source pane beside an Employee pane
- **THEN** the panes remain identifiable from layout and owned content without a vertical separator rule

#### Scenario: Analytics group surface
- **WHEN** populated Analytics renders its six groups in light or dark theme
- **THEN** every group has a quiet card background and internal spacing without a border, shadow, title rule, or row rule

#### Scenario: Status band
- **WHEN** an error or informational status appears
- **THEN** its owned background and text treatment distinguish it without a bottom rule

#### Scenario: Responsive header containment
- **WHEN** the application renders at 390, 1024, or 1280 px wide
- **THEN** global actions remain reachable, tab overflow remains inside its navigation region, and the page has no horizontal overflow

#### Scenario: Meaningful surface contrast
- **WHEN** the continuous shell renders in light or dark theme
- **THEN** cards, fields, dialogs, popovers, calendar cells, Analytics groups, and interactive controls remain visually distinct from the shell without adding a header separator

### Requirement: Repeated rows are separated without line rules
Repeated interface rows SHALL use content layout and interaction feedback instead of decorative line
rules. Virtualized Employee card lists SHALL render contiguous rows without shell-background gaps or
individual list-row corner rounding. This applies alongside virtualized and non-virtualized filters,
tag pickers, mappings, event lists, and import previews.

#### Scenario: Interactive option list
- **WHEN** a user navigates a filter or tag list with pointer or keyboard
- **THEN** each option remains identifiable from layout and active feedback without a row divider

#### Scenario: Contiguous Employee list
- **WHEN** multiple Employees render in a list surface
- **THEN** adjacent cards form continuous rows without an inter-card gap, individual corner rounding, or row divider

#### Scenario: Mapping and preview rows
- **WHEN** a generic mapping or structured preview contains multiple rows
- **THEN** aligned fields, hierarchy, cards, and spacing remain readable without repeated row rules

### Requirement: Meaningful component boundaries remain
The application SHALL retain outlines that communicate interactive controls, selectable cards,
dialogs, calendar cells, hierarchy guides, focus, errors, or destructive states. Adjacent Teams and
Download panes SHALL not use an outline solely as a layout separator. Analytics groups SHALL use an
owned background rather than an outline to communicate their boundary.

#### Scenario: Interactive boundary audit
- **WHEN** the borderless chrome is rendered in light or dark theme
- **THEN** fields, choice cards, calendar cells, hierarchy guides, focus rings, and destructive selections remain visually bounded

#### Scenario: Narrow layout
- **WHEN** the Import dialog renders at a 390 px viewport
- **THEN** operation cards stack, content remains inside the dialog, and no page-level horizontal overflow appears
