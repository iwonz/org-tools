## MODIFIED Requirements

### Requirement: Staffing Slots share Editor row geometry without Employee semantics

Employee and Staffing Slot rows SHALL use one discriminated ordered layout with measured Tag-chip heights and prefix offsets for DOM rendering, virtualization, bounds, hit testing, Unit layout, and canvas anchors. Every Staffing Slot SHALL precede every Employee, including the boss. Slots SHALL sort among themselves by active Tag priority, normalized name, and stable ID when Tag grouping is enabled, and by normalized name and stable ID when it is disabled. Employees SHALL retain their existing ordering with the boss first inside the Employee block. Slots SHALL retain the neutral placeholder avatar, one-pixel dashed vacancy outline, and a fixed `rgba(244, 63, 94, 0.15)` resting surface shared by DOM and PNG; the existing selected surface MUST take precedence. Slot Tags MAY affect ordering inside the Slot block but MUST NOT affect Employee counts, distribution, Employee search, or Unit Tag-cloud summaries. Collapse SHALL hide slots and retain a deterministic Unit-edge anchor fallback.

#### Scenario: Render a mixed Live Unit
- **WHEN** an expanded Live Unit contains derived Employees and named or unnamed tagged slots
- **THEN** every Slot renders before the boss and remaining Employees while shared geometry and Employee-only projections remain unchanged

#### Scenario: Sort the Slot block
- **WHEN** a Unit contains several Slots and Tag grouping is enabled or disabled
- **THEN** the Slot block uses Tag/name/ID or name/ID order respectively without interleaving Employees

#### Scenario: Emphasize a resting Slot
- **WHEN** a Staffing Slot row renders without selection
- **THEN** DOM and PNG use the same translucent Rose fill beneath the unchanged dashed outline and content

#### Scenario: Collapse an attached slot
- **WHEN** a canvas element targets a Staffing Slot side anchor and its Unit collapses
- **THEN** the target resolves to the corresponding Unit edge without losing its persistent link

### Requirement: Unit headers report Employees and Staffing Slots separately

Every Editor Unit summary SHALL derive distinct direct and descendant Employee counts plus direct and descendant Staffing Slot counts. Each summary line MUST omit zero-valued fragments and its separator, and the complete line including its prefix MUST be absent when both values are zero. A Unit with children SHALL render the remaining total and in-Unit lines in that order; a leaf SHALL render its unprefixed direct line only when it is non-empty. The fixed summary area SHALL vertically center zero, one, or two visible lines without changing Unit geometry. Slots MUST NOT contribute to either Employee count.

#### Scenario: Summarize a parent Unit
- **WHEN** a parent has nonzero descendant totals but zero direct Employees and Slots
- **THEN** only the centered Total line appears and the In Unit prefix, zero counts, and separator are absent

#### Scenario: Summarize one nonzero kind
- **WHEN** one summary scope contains only Employees or only Staffing Slots
- **THEN** it displays only the localized nonzero count without a leading or trailing separator

#### Scenario: Summarize an empty leaf
- **WHEN** a leaf has zero direct Employees and zero direct Staffing Slots
- **THEN** its fixed summary area remains empty without changing the header, row origin, Unit bounds, or anchors

### Requirement: Editor PNG reproduces Staffing Slots and Unit summaries

The Editor DOM and full-View or Unit/subtree PNG SHALL use the same Slot-first ordering, measured geometry, fallback names, placeholder avatars, translucent Rose surfaces, dashed outlines, complete Tag chips, collapse visibility, anchor resolution, zero-filtered Unit summary lines, and summary centering. Scoped PNG SHALL include canvas elements transitively attached to included Slots. Employee-format templates SHALL apply only to Employees, and transient interaction styling MUST NOT appear in PNG.

#### Scenario: Export a mixed hierarchy
- **WHEN** a hierarchy containing Employees, Staffing Slots, and zero or nonzero summary values is exported
- **THEN** DOM and PNG contain matching row order, Slot surfaces, summary text, bounds, and attachments while Employee-only counts remain distinct
