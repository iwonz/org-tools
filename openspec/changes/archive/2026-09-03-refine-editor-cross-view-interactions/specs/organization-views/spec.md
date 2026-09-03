## MODIFIED Requirements

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

## ADDED Requirements

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
