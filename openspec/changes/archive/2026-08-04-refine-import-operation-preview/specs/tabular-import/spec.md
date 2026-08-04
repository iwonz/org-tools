## ADDED Requirements

### Requirement: Generic Team mapping uses the structured hierarchy preview
The application SHALL preview mapped generic Teams and Teams + Employees through the same
virtualized hierarchy and read-only Employee cards used by recognized partial state.

#### Scenario: Mapped Teams preview
- **WHEN** mapped JSON produces nested manual Teams
- **THEN** the preview preserves hierarchy and sibling order with all Teams expanded initially

#### Scenario: Mapped combined preview
- **WHEN** mapped JSON produces inline Employee assignments
- **THEN** Employee cards appear under their Teams with mapped position and boss state before the atomic Append

#### Scenario: Mapping change resets hierarchy state
- **WHEN** the selected collection, target, or field mapping changes
- **THEN** the rebuilt preview resets local collapsed Teams and reflects only the current normalized graph
