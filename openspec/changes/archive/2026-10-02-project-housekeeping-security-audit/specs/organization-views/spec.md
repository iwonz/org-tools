## MODIFIED Requirements

### Requirement: View UI and history remain isolated and bounded
Each View SHALL retain its own viewport, selection, enabled distribution Units, and undo/redo
history while it exists. One clipboard SHALL be shared by all Views in the current tab for
cross-View paste. Viewport, selection, enabled distribution Unit IDs, and active View SHALL persist
only in the authenticated account's bounded UI state; history and clipboard remain tab-memory only.
The clipboard MUST NOT enter the organization document, account UI state, PostgreSQL, system
clipboard payload, logs, URLs, or network traffic. Switching Views MUST NOT serialize the organization.

#### Scenario: Switch between Views
- **WHEN** the user changes active View and later returns
- **THEN** bounded UI restores its viewport and selection while the tab retains independent document history

#### Scenario: Copy across Views
- **WHEN** the user copies Units in one View, switches to another View, and pastes
- **THEN** the target receives remapped Unit and internal Live IDs, shared Employee IDs, and one target-View history command

#### Scenario: Materialize an external Live dependency
- **WHEN** a copied Live Unit references a Unit outside the copied closure and is pasted into another View
- **THEN** it becomes static with copy-time visible membership while Live Units with only global or copied dependencies retain rules

#### Scenario: Undo a cross-View paste
- **WHEN** the user undoes a cross-View paste
- **THEN** only the target View document changes and the source View remains unchanged

#### Scenario: Persist View UI
- **WHEN** a View viewport, selection, or distribution mode changes
- **THEN** only bounded per-account UI state is written without serializing Unit or Employee collections

#### Scenario: Delete an enabled Unit
- **WHEN** an enabled Unit is removed through any deletion entry point
- **THEN** its ID is removed from bounded View UI before strict validation and persistence

### Requirement: View settings are strict isolated document state
Each View document SHALL own required settings containing boolean `groupByTag` and `showTagCloud`
plus non-null named or canonical HEX distribution colors. Defaults SHALL remain true, true, green,
and amber. Unit documents MUST NOT retain `groupByTag`. Settings SHALL participate in strict
organization parsing, revision-checked PostgreSQL commands, server projection refresh, View cloning,
and View-local undo/redo; compatibility readers MUST NOT be added.

#### Scenario: Copy or create a View
- **WHEN** a View is copied or created blank
- **THEN** the copy receives independent source settings and a blank View receives defaults

#### Scenario: Paste Units across Views
- **WHEN** Units are pasted into another View
- **THEN** their presentation follows target View settings without importing source preferences

#### Scenario: Reject obsolete or invalid document
- **WHEN** settings are missing, contain extra keys or invalid values, or a Unit retains `groupByTag`
- **THEN** strict command validation rejects the candidate without mutation

#### Scenario: Refresh authorized settings
- **WHEN** a valid settings command is committed and the server event is received
- **THEN** affected authorized Unit rendering uses current View settings while other Views remain independent
