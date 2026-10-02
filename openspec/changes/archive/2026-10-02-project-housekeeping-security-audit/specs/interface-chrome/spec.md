## ADDED Requirements

### Requirement: Current transfer actions use permission-aware focused workflows
Backup/Restore SHALL remain inside Super Administrator Administration, while Data Download and Editor
export SHALL use their existing focused surfaces and effective permissions. These workflows MUST NOT
expose legacy State or Employee Import controls, tabs, mapping, or duplicate-review chrome.

#### Scenario: Open complete recovery
- **WHEN** a Super Administrator activates Backup or Restore
- **THEN** focus enters the Administration workflow and returns to its trigger on close or completion

#### Scenario: Open authorized output
- **WHEN** an account activates Data Download or an Editor export it can use
- **THEN** the focused output surface contains only resources from its authorized projection

## REMOVED Requirements

### Requirement: Global transfer actions use focused modal workflows
**Reason**: The State Import/Export and Employee Import modal described by this requirement no longer exists.

**Migration**: Complete recovery uses encrypted Backup/Restore in Administration; Data Download and Editor export remain separate permission-filtered workflows.
