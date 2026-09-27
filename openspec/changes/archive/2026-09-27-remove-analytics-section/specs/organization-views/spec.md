## MODIFIED Requirements

### Requirement: The system View is the canonical Units structure
The system View SHALL use the localized Units destination label and SHALL be the sole structure used by Units, global Employee Team assignment, and Employee-array Team Import. It SHALL NOT be renamable or deletable. Editor edits to the system View and Units edits SHALL operate on the same document.

#### Scenario: Edit system Units from Editor
- **WHEN** the active Editor View is the system View and a Unit changes
- **THEN** Units immediately displays the same change without synchronization or document copying

#### Scenario: Protect the system View
- **WHEN** the View toolbar displays the system View
- **THEN** rename and delete actions are disabled while create remains available

## REMOVED Requirements

### Requirement: Saved analytics references protect Views
**Reason**: Saved Analytics references no longer exist.
**Migration**: View deletion continues to honor every remaining reference and no longer checks removed Analytics definitions.
