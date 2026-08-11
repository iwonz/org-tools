## MODIFIED Requirements

### Requirement: Application chrome is separated without decorative rules
The application SHALL use one borderless 56 px header and one continuous root surface: white in the
light theme and a shared dark neutral in the dark theme. Every product workflow SHALL begin flush
with the bottom edge of that header without a tab-specific outer top inset, so switching between the
Editor canvas and ordinary content does not shift the workflow boundary. It SHALL use whitespace,
typography, alignment, and interaction feedback instead of bordered, rounded, or filled layout
islands and instead of decorative horizontal rules in the main shell, status bands, product surface
headers, and local section headers. The header SHALL contain a horizontally containable product-tab
region on the left and a fixed global-action region on the right. Product tabs SHALL render as a
flat, spaced group without a shared boundary, persistent fill, or underline; the active tab SHALL
use stronger foreground text and weight. Every nested tab group SHALL use the same flat treatment.
Language, theme, Import, and Export controls SHALL render as a flat, spaced group without a shared
enclosing surface. Populated Employees, Teams, Analytics, Calendar, and Download SHALL place their
headers, controls, panes, lists, and sections directly on the continuous root surface without an
outer rounded workflow container or nested decorative section fills. Teams and Download SHALL
separate adjacent source and Employee panes through compact layout and grouping without a vertical
rule. Meaningful fields, dialogs, popovers, selectable and destructive choices, calendar cells,
focus and error states, hierarchy guides, and data objects whose boundary communicates identity
SHALL retain their required bounded treatment.

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
- **AND** the active tab uses stronger foreground text and weight without an underline, button-like fill, individual border, or enclosing pill

#### Scenario: Consistent flat nested tabs
- **WHEN** a tab group renders in Download, a dialog, or another product workflow
- **THEN** its triggers use the same spaced flat treatment and the selected trigger is identified without a shared segmented boundary or persistent fill

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
- **THEN** fields, dialogs, popovers, selectable choices, calendar cells, Editor data nodes, and interactive states remain visually distinct without restoring layout islands

#### Scenario: Stable product workflow origin
- **WHEN** a user switches between Editor and any populated product workflow
- **THEN** both workflows begin immediately below the unified header without an outer top margin or a vertical boundary jump
