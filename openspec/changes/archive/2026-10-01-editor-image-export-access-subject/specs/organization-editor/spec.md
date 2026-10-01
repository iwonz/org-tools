## ADDED Requirements

### Requirement: One selected source drives complete Editor PNG geometry
Editor PNG derivation SHALL package Employees, authorized Template values, field definitions, Tags,
Units, Live memberships, Staffing Slots, Canvas elements, View settings, summaries, and distribution
input into one selected source. Full-View and scoped renders MUST NOT combine collections from
different account projections or revisions.

#### Scenario: Render a filtered View
- **WHEN** the selected account has narrower field, Tag, Unit, Slot, Employee, or View access than the acting Super Administrator
- **THEN** image rows, summaries, bounds, attachments, and drawing plans are recomputed solely from the selected projection

#### Scenario: Security revision changes during preview
- **WHEN** organization or security revision changes while an alternate source is loading or displayed
- **THEN** stale work is cancelled, image actions remain disabled, and the selected source is rebuilt before another render

#### Scenario: Preserve transient distribution presentation
- **WHEN** the acting administrator exports with distribution presentation enabled
- **THEN** distribution inputs are intersected with Units and Employees present in the selected projection before geometry or drawing
