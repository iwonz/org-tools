## MODIFIED Requirements

### Requirement: File System Access is progressive and recoverable
The browser runtime SHALL use user-activated File System Access pickers when both required methods
are available, SHALL persist only the last successful file handle in IndexedDB, and SHALL use memory
plus standard input/download behavior otherwise. When the API is unavailable, the interface SHALL
omit the Autosave control and every explanatory File System Access label while retaining functional
New, Open, Save, and Save As fallbacks.

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
- **THEN** Open uses a normal JSON input, Save and Save As download `org-tools-state.json`, the
  Autosave row and support explanation are absent, and the workspace remains fully functional in
  the current tab

#### Scenario: Reconnect remembered file
- **WHEN** a remembered handle requires permission after reload
- **THEN** editing waits for an explicit Reconnect or Start blank choice and no permission is
  requested in the background
