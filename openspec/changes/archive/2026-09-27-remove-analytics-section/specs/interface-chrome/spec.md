## MODIFIED Requirements

### Requirement: Product workflows use purposeful grouping
Teams, Employees, Calendar, and Download SHALL render their primary task content full-bleed without
an outer panel border, radius, shadow, or shell-colored gap. Teams and Download SHALL distinguish
source and detail panes through tone, typography, and compact layout without a decorative separator.
Calendar SHALL group its header, Tag rail, and month grid through spacing and tone while individual
day cells keep semantic boundaries. The Editor SHALL retain an edge-to-edge neutral canvas with
floating toolbar surfaces and bounded data nodes.

#### Scenario: Split workflow
- **WHEN** populated Teams or Download renders adjacent source and detail panes
- **THEN** the panes share one full-bleed workflow and remain distinguishable without an outer frame,
  empty gutter, decorative separator, or a card around each row

#### Scenario: Calendar workflow
- **WHEN** Calendar contains birthdays or dated tag events
- **THEN** its controls, Tag rail, and cells read as one bounded workflow while every day cell
  remains individually actionable and legible

#### Scenario: Editor workspace
- **WHEN** the Editor renders an empty or populated current structure
- **THEN** the canvas retains its full interactive area and distinct neutral background while its
  toolbar groups, nodes, selection, and focus states use the shared visual language

### Requirement: Repeated content remains scan-friendly and performant
Repeated content SHALL use alignment, compact spacing, subtle row separation where useful, and
interaction feedback instead of floating row tiles across Employee lists, filters, tag pickers, and
event lists. Existing virtualization, stable keys, content-driven measurement, wrapped tag
visibility, and bounded scrolling SHALL remain unchanged.

#### Scenario: Contiguous Employee list
- **WHEN** multiple Employees render in a virtualized list
- **THEN** rows remain contiguous and content-driven while a subtle separator and hover or focus
  state make row boundaries scannable

#### Scenario: Many Employee tags
- **WHEN** an Employee row contains tags that wrap across multiple lines
- **THEN** all tags remain visible, the virtualizer remeasures the content, and adjacent rows do not
  overlap

### Requirement: Navigation prioritizes Employees
The sidebar SHALL order Employees before Units while preserving the existing order of Editor,
Calendar, Data Download, and utility actions.

#### Scenario: Read the primary navigation
- **WHEN** the sidebar is expanded or compact
- **THEN** Employees is the first product section and Units is second with unchanged icon geometry

## REMOVED Requirements

### Requirement: Dashboard builder chrome is responsive and accessible
**Reason**: The Analytics dashboard builder and all of its chrome are removed.
**Migration**: Remaining product surfaces preserve their responsive and accessible controls.
