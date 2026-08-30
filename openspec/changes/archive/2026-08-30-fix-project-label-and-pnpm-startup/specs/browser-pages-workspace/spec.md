## MODIFIED Requirements

### Requirement: Browser workspace uses one explicit local file
The browser runtime SHALL manage one current full-workspace JSON file, SHALL expose a user-facing
Project menu with New project, Open project, Save, Save As, and current project filename, and SHALL
validate the exact current `OrgToolsState` contract before replacing or writing state. User-facing
labels and feedback SHALL call the editable organization a Project while the serialized contract
remains a workspace.

#### Scenario: Open valid workspace
- **WHEN** Open project selects a valid `content: "workspace"` state
- **THEN** the current store is replaced atomically, the file becomes the current Project file, and
  the project is clean

#### Scenario: Reject invalid or partial workspace
- **WHEN** Open project selects corrupt JSON, an obsolete state, or a partial state scope
- **THEN** the current project and remembered file handle remain unchanged and an actionable
  Project-oriented error is shown

#### Scenario: Create blank workspace
- **WHEN** New project completes after any dirty-state decision
- **THEN** one blank Main View opens and the previous current file is no longer bound
