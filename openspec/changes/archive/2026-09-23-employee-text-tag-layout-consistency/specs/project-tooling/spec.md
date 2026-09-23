## RENAMED Requirements

- FROM: `### Requirement: Gallery verifies compact Unit Tag footers`
- TO: `### Requirement: Gallery verifies universal Unit Tag footers`

## MODIFIED Requirements

### Requirement: Gallery verifies universal Unit Tag footers
The maintained Editor screenshots SHALL show content-sized direct-Tag footer chips with the
universal 8 pixel inline inset, 6 pixel two-axis gaps, and no extra trailing area after the measured
count. Screenshot generation SHALL retain the maintained 59 declared scenarios.

#### Scenario: Regenerate Editor frames
- **WHEN** the deterministic gallery is generated twice from unchanged source
- **THEN** affected Editor frames show universally sized evenly inset footer chips and all 59 PNG hashes match between runs

### Requirement: Maintained validation covers unified Employee inline layout
The deterministic gallery and browser suite SHALL retain the maintained scenario count and cover
complete username and email suffixes, actual-font Markdown measurement, one universal Tag surface,
long multilingual Tag fragments, dated and counted suffix insets, adjacent formatted Employee
content, both PNG format inputs, Editor geometry, virtualized Tag controls, catalog drag previews,
Calendar, and Unit Tag footers. Two unchanged gallery runs MUST produce identical hashes.

#### Scenario: Regenerate unified layout frames
- **WHEN** the maintained gallery is generated twice after the shared layout change
- **THEN** every one of the 59 hashes matches and affected frames show complete identity text plus aligned DOM and PNG Tag geometry

#### Scenario: Exercise multilingual measurement
- **WHEN** browser validation renders Latin, Cyrillic, Arabic, CJK, emoji, Markdown marks, dates, and counts across supported surfaces
- **THEN** no final glyph is clipped and every Tag suffix retains the exact shared trailing inset
