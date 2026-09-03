# organization-views Specification

## Purpose
TBD - created by archiving change add-isolated-editor-views. Update Purpose after archive.
## Requirements
### Requirement: Organization Views isolate Unit documents over global catalogs
The organization SHALL contain exactly one protected system View and zero or more custom Views.
Each View SHALL own its Unit hierarchy, memberships, positions, bosses, Live rules, layout, geometry,
and timestamps. Employees, custom field definitions, values, and Tags SHALL remain global and SHALL
NOT be copied or overridden by a View. Unit IDs MUST be unique across all Views.

#### Scenario: Edit a custom View
- **WHEN** a Unit, assignment, hierarchy edge, rule, or position changes in a custom View
- **THEN** no Unit document in the system or another custom View changes

#### Scenario: Edit global Employee data
- **WHEN** an Employee profile, custom value, or Tag assignment changes from any surface
- **THEN** every View resolves that same current global Employee without a local copy

#### Scenario: Remove an Employee from a View
- **WHEN** an Employee row is removed from a custom View Unit
- **THEN** only that View assignment is removed and the Employee remains in the global catalog

#### Scenario: Delete an Employee globally
- **WHEN** the catalog deletion workflow removes an Employee
- **THEN** every View membership, boss, position, and selection reference to that Employee is removed atomically

### Requirement: The system View is the canonical Units structure
The system View SHALL use the localized Units destination label and SHALL be the sole structure used
by Units, global Employee Team assignment, Employee-array Team Import, and Analytics. It SHALL NOT be
renamable or deletable. Editor edits to the system View and Units edits SHALL operate on the same
document.

#### Scenario: Edit system Units from Editor
- **WHEN** the active Editor View is the system View and a Unit changes
- **THEN** Units immediately displays the same change without synchronization or document copying

#### Scenario: Protect the system View
- **WHEN** the View toolbar displays the system View
- **THEN** rename and delete actions are disabled while create remains available

### Requirement: Users can create and manage isolated custom Views
Users SHALL be able to create a blank custom View or copy any existing View, rename a custom View,
and delete it after confirmation. Names SHALL be 1–100 characters and unique after NFKC
normalization, trim, whitespace collapse, and case folding.

#### Scenario: Create a blank View
- **WHEN** the user supplies a valid unique name and selects Blank
- **THEN** a custom View with the default empty document and viewport becomes active

#### Scenario: Copy an existing View
- **WHEN** the user selects Copy and any source View
- **THEN** structure, membership, rules, collapse, layout, geometry, and viewport are copied with new View and Unit UUIDs, remapped references, and empty selection/history

#### Scenario: Reject an invalid name
- **WHEN** a name is empty, longer than 100 characters, or normalization-equivalent to another custom View name
- **THEN** creation or rename is rejected without changing any View

#### Scenario: Delete the active custom View
- **WHEN** the user confirms deletion of the active custom View
- **THEN** only that View is removed and Editor falls back to the system View

### Requirement: View UI and history remain isolated and bounded
Each View SHALL retain its own viewport, selection, and undo/redo history while it exists. One
clipboard SHALL be shared by all Views in the current tab so a copied Unit fragment can be pasted
after switching Views. Only viewport and selection SHALL be durable; history and clipboard SHALL
remain session-only. The clipboard MUST NOT enter `OrgToolsState`, SQLite, `BroadcastChannel`, the
system clipboard, or network traffic and SHALL clear when the complete state is replaced or
imported. Switching Views SHALL NOT serialize organization data.

#### Scenario: Switch between Views
- **WHEN** the user changes the active View and later returns
- **THEN** that View restores its viewport, selection, and independent document history

#### Scenario: Copy across Views
- **WHEN** the user copies Units in one View, switches to another View, and pastes
- **THEN** the target receives new Unit IDs, remapped copied hierarchy and internal Live references, global Employee IDs, and one target-View history command

#### Scenario: Materialize an external Live dependency
- **WHEN** a copied Live Unit references a Unit outside the copied closure and is pasted into another View
- **THEN** that Unit becomes static with its copy-time visible membership while Live Units with only global or copied dependencies retain their rules

#### Scenario: Undo a cross-View paste
- **WHEN** the user undoes a cross-View paste
- **THEN** only the target View document changes and the source View remains unchanged

#### Scenario: Replace complete state
- **WHEN** Import or another full-state replacement succeeds
- **THEN** the shared transient clipboard is empty

#### Scenario: Persist View UI
- **WHEN** a View viewport or selection changes
- **THEN** the bounded UI projection writes without serializing any Unit or Employee collection

### Requirement: View lifecycle controls avoid redundant hover help
The View Select, Create, Rename, and Delete controls SHALL retain localized accessible names, focus
feedback, and keyboard behavior without custom hover tooltips or native `title` attributes. The View
Select SHALL expose its actual option surface only after activation.

#### Scenario: Hover View controls
- **WHEN** a pointer hovers or keyboard focus reaches any View toolbar control
- **THEN** no tooltip or native title appears and the control geometry remains unchanged

#### Scenario: Open the View Select
- **WHEN** the user activates the View Select
- **THEN** the styled list of Views opens and remains keyboard navigable

### Requirement: View derivation remains bounded
Derived structures SHALL be cached by global catalog and View document revisions. The runtime SHALL
materialize only the system View, active Editor View, and selected Download View as needed rather
than rebuilding every custom View after each UI action.

#### Scenario: Navigate a large custom View
- **WHEN** 20,000 Employees and 4,000 Units exist and the user pans, zooms, or changes selection
- **THEN** inactive Views are not rebuilt and the interaction performs no organization write

#### Scenario: Change global Employee data
- **WHEN** a global Employee mutation invalidates View-derived data
- **THEN** only currently consumed View structures rebuild on demand
