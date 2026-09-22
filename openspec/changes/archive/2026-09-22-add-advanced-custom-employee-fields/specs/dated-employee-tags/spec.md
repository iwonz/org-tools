## ADDED Requirements

### Requirement: Composite dates create Calendar events
Every populated date subfield in every Composite record SHALL produce one locally indexed Calendar event. The event label SHALL identify the Composite field, primary-key display value, and date subfield. Tag events SHALL retain their catalog order, color, and interactive Tag history, while Composite events SHALL use neutral presentation without pretending to be Tag assignments.

#### Scenario: Record contains several dates
- **WHEN** one Composite record has two populated date subfields
- **THEN** the Employee appears in one event for each corresponding Calendar date

#### Scenario: Open a Composite event day
- **WHEN** a Calendar day contains Composite events
- **THEN** the day dialog groups complete Employee cards under their Composite event labels
