## MODIFIED Requirements

### Requirement: Screenshot gallery covers Employee display formats
The deterministic gallery SHALL remain exactly 59 PNG files. The primary Employee-model frame SHALL
show the icon-labeled Display tab, flat format sections, a rich native preview, and the Markdown
selection menu, while existing Value and Template frames SHALL continue to cover Model. Repeated
unchanged generation MUST produce identical hashes.

#### Scenario: Generate the Employee model gallery
- **WHEN** the maintained gallery is generated twice from unchanged source
- **THEN** all 59 PNG hashes match and the Employee-model frames cover Markdown Display editing plus the existing Model workflows
