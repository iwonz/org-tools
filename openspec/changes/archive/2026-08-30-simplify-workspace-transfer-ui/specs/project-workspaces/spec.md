## MODIFIED Requirements

### Requirement: Organization data saves explicitly and atomically
Organization changes SHALL remain dirty until a successful manual or enabled automatic Save, SHALL
support Ctrl+S and Cmd+S, and SHALL be written as one parsed full-state snapshot in an atomic SQLite
transaction. Autosave SHALL default off, debounce organization changes for 1000 ms, serialize at
most one request at a time, and schedule a follow-up when a newer change occurs during a request.
Every Save SHALL send the expected revision and increment it only after a successful write. Complete
workspace Import SHALL replace only the current in-memory organization and make it dirty without
changing project ID, name, or revision; Export SHALL use live state regardless of save status.
UI-only changes SHALL NOT serialize the organization snapshot.

#### Scenario: Explicit Save
- **WHEN** a user manually saves a dirty project with the current revision
- **THEN** any pending timer is canceled, the exact validated state is committed once, and the
  project becomes clean unless a newer local change occurred

#### Scenario: Enabled Autosave
- **WHEN** Autosave is enabled and organization data changes
- **THEN** one trailing Save begins after 1000 ms and no concurrent state request is created

#### Scenario: Autosave follow-up
- **WHEN** organization data changes during an automatic Save
- **THEN** the completed request marks only its captured sequence saved and one later Save handles
  the newer sequence

#### Scenario: Autosave failure or conflict
- **WHEN** automatic Save fails or reports a stale revision
- **THEN** Autosave pauses, dirty state remains, and existing recovery actions require an explicit
  outcome

#### Scenario: Invalid state Save
- **WHEN** the submitted state fails the production parser
- **THEN** stored state and revision remain unchanged and the client remains dirty

#### Scenario: Complete workspace Import
- **WHEN** a valid complete workspace replaces the current working copy
- **THEN** the project identity and stored revision stay unchanged until an explicit or automatic
  Save commits the dirty imported state

#### Scenario: Unsaved project navigation
- **WHEN** a user leaves a project while organization data is dirty
- **THEN** Save, Discard, and Cancel are offered and navigation waits for the chosen safe outcome

#### Scenario: Browser close with unsaved data
- **WHEN** a page unload is attempted while organization data is dirty
- **THEN** the browser's native unsaved-change confirmation is requested
