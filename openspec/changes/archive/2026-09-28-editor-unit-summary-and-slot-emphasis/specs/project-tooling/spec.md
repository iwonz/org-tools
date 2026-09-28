## MODIFIED Requirements

### Requirement: Staffing Slot delivery has deterministic Editor evidence

Browser validation SHALL cover named and unnamed Staffing Slots in manual and Live Units, create/edit/delete, one-slot and selected-slot movement, Tags, strict State, selection, anchors, Unit/View copy, Slot-first ordering, zero-filtered summaries, Rose surfaces, collapse, virtualization, Undo/Redo, and DOM/PNG parity in both production runtimes. The maintained 56-frame gallery SHALL show the revised Editor without adding a scenario and SHALL remain deterministic across two runs.

#### Scenario: Validate Staffing Slot workflows
- **WHEN** Server and Pages browser checks exercise mixed Unit hierarchies with zero and nonzero summary values
- **THEN** Slot lifecycle, ordering, surface, summary visibility, and geometry pass while Units and Employee-oriented surfaces remain unchanged

#### Scenario: Regenerate maintained screenshots
- **WHEN** the 56-frame gallery is generated twice from unchanged source and fixtures
- **THEN** every PNG is visually inspected and both SHA-256 sets are identical
