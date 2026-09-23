## MODIFIED Requirements

### Requirement: Screenshot gallery covers Employee display formats
The deterministic gallery SHALL remain exactly 59 PNG files. The primary Employee-model frame SHALL
show the icon-labeled Display tab, flat format sections, numeric line-gap inputs, per-format Reset
actions, a rich native preview, the Markdown selection menu, and no Display Save button. Existing
Value and Template frames SHALL continue to cover Model. Repeated unchanged generation MUST produce
identical hashes.

#### Scenario: Generate the Employee model gallery
- **WHEN** the maintained gallery is generated twice from unchanged source
- **THEN** all 59 PNG hashes match and the Employee-model frames cover live Markdown Display editing, Reset actions, numeric gaps, and the existing Model workflows
