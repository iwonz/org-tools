## ADDED Requirements

### Requirement: Saved Unit notes use the existing state runtime
Saving a Unit note SHALL enqueue the same immediate organization write and live-tab broadcast as
other structural commands. Draft text and dialog state MUST remain component-local and MUST NOT be
written to SQLite, browser storage, `BroadcastChannel`, or the public State before Save.

#### Scenario: Persist a saved note in server mode
- **WHEN** a valid note is saved and the local application reloads
- **THEN** the singleton SQLite state restores that note

#### Scenario: Synchronize a saved note in browser mode
- **WHEN** a note is saved while another Pages tab is live
- **THEN** the peer tab receives the complete validated state containing the note, while unsaved
  drafts are never broadcast
