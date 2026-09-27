## MODIFIED Requirements

### Requirement: Employee-oriented exports exclude open positions

Open positions SHALL remain present only in complete State Export and Editor PNG. Employee transfer,
JSON, Template, Units, and Calendar projections MUST continue to operate only on global Employees and
MUST NOT serialize, count, search, or emit open positions.

#### Scenario: Export data from a View with positions
- **WHEN** a source View contains open positions and a user exports Employees, JSON, or Template data
- **THEN** output is identical to the same Employee assignments without those positions

## REMOVED Requirements

### Requirement: Complete transfer includes analytics configuration
**Reason**: Complete State no longer contains Analytics configuration or UI data.
**Migration**: Current transfers use the new exact State shape and reject old Analytics-bearing payloads atomically.
