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
Populated Employees, Teams, Analytics, and Download SHALL each group their complete surface header,
controls, and content inside one rounded card-background island inset from the shell. Teams and
Download SHALL separate adjacent source and Employee panes through layout and grouping without a
vertical rule. Analytics SHALL group each sortable list on a quiet nested surface and use compact
12 px grid gaps. The root shell, transparent header, and all six top-level product surfaces SHALL
share the shell background, while meaningful cards, fields, dialogs, popovers, calendar cells, and
interactive controls retain their own bounded surface treatment.

#### Scenario: Populated product island
- **WHEN** populated Employees, Teams, Analytics, or Download renders below the unified app header
- **THEN** one inset rounded surface contains that workflow's header, controls, panes, and scrollable content
- **AND** the surrounding top-level product surface remains continuous with the shell

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
- **AND** the Teams pane seam uses compact internal spacing without an empty gutter

#### Scenario: Analytics group surface
- **WHEN** populated Analytics renders its six groups in light or dark theme
- **THEN** the complete Analytics workflow has one outer island while every group retains a quiet nested background and internal spacing without a border, shadow, title rule, or row rule
- **AND** desktop groups use 12 px horizontal and vertical gaps

#### Scenario: Status band
- **WHEN** an error or informational status appears
- **THEN** its owned background and text treatment distinguish it without a bottom rule

#### Scenario: Responsive header containment
- **WHEN** the application renders at 390, 1024, or 1280 px wide
- **THEN** global actions remain reachable, tab overflow remains inside its navigation region, and the page has no horizontal overflow

#### Scenario: Meaningful surface contrast
- **WHEN** the continuous shell renders in light or dark theme
- **THEN** product islands, fields, dialogs, popovers, calendar cells, nested Analytics groups, and interactive controls remain visually distinct from the shell without adding a header separator
