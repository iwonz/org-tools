## ADDED Requirements

### Requirement: Screenshot gallery covers Employee display formats
The deterministic gallery SHALL remain exactly 59 PNG files. The primary Employee-model frame SHALL
show the Display tab and its live previews, while existing Value and Template frames SHALL continue
to cover Model. Repeated unchanged generation MUST produce identical hashes.

#### Scenario: Generate the Employee model gallery
- **WHEN** the maintained gallery is generated twice from unchanged source
- **THEN** all 59 PNG hashes match and the Employee-model frames cover both Model and Display
