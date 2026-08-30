## ADDED Requirements

### Requirement: Pages hosts the functional browser workspace
The GitHub Pages root SHALL render the six-workflow Org Tools application from a static export under
the repository base path without a backend, SQLite, project endpoint, dynamic project route, or
showcase landing page.

#### Scenario: Open public application
- **WHEN** a visitor opens `/org-tools/`
- **THEN** they can use Units, Employees, Editor, Analytics, Calendar, Download, Import, workspace
  Export, theme, and language directly in one editable blank workspace

#### Scenario: Static application network audit
- **WHEN** the visitor imports, edits, searches, analyzes, opens Calendar, and exports data
- **THEN** the page makes no project API, telemetry, third-party, or organization-data request

### Requirement: Browser workspace uses one explicit local file
The browser runtime SHALL manage one current full-workspace JSON file, SHALL expose New, Open, Save,
Save As, and current filename, and SHALL validate the exact current `OrgToolsState` contract before
replacing or writing state.

#### Scenario: Open valid workspace
- **WHEN** Open selects a valid `content: "workspace"` state
- **THEN** the current store is replaced atomically, the file becomes current, and the workspace is
  clean

#### Scenario: Reject invalid or partial workspace
- **WHEN** Open selects corrupt JSON, an obsolete state, or a partial state scope
- **THEN** the current workspace and remembered file handle remain unchanged and an actionable error
  is shown

#### Scenario: Create blank workspace
- **WHEN** New completes after any dirty-state decision
- **THEN** one blank Main View opens and the previous current file is no longer bound

### Requirement: File System Access is progressive and recoverable
The browser runtime SHALL use user-activated File System Access pickers when both required methods
are available, SHALL persist only the last successful file handle in IndexedDB, and SHALL use memory
plus standard input/download behavior otherwise.

#### Scenario: Save bound file
- **WHEN** a supported browser saves a valid workspace to a bound writable handle
- **THEN** the complete JSON is written and closed before the captured organization sequence becomes
  clean

#### Scenario: Save without a handle
- **WHEN** Save runs in a supported browser without a bound handle
- **THEN** Save As requests a destination from the originating user action and binds it only after a
  successful write

#### Scenario: Unsupported browser fallback
- **WHEN** File System Access pickers are unavailable
- **THEN** Open uses a normal JSON input, Save downloads `org-tools-state.json`, Autosave is disabled,
  and the workspace otherwise remains fully functional in the current tab

#### Scenario: Reconnect remembered file
- **WHEN** a remembered handle requires permission after reload
- **THEN** editing waits for an explicit Reconnect or Start blank choice and no permission is
  requested in the background

### Requirement: Browser file conflicts require an explicit decision
The browser runtime MUST compare the current file size and modification time with the last observed
fingerprint before writing and MUST preserve local dirty state when they differ.

#### Scenario: External file modification
- **WHEN** the bound file fingerprint changes before manual or automatic Save
- **THEN** writing pauses and Load file, Overwrite, Save As, and Cancel are offered

#### Scenario: Resolve browser conflict
- **WHEN** the user selects one conflict action
- **THEN** only that explicit load, overwrite, new-file write, or no-op outcome occurs
