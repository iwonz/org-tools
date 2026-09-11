## ADDED Requirements

### Requirement: View settings receive end-to-end verification
Documentation and the deterministic gallery SHALL cover View settings, cloud visibility, and
custom distribution colors. Validation SHALL exercise isolated history, View copying, Unit Paste,
strict state boundaries, live-tab synchronization, canvas/PNG agreement, and the maintained scale.

#### Scenario: Review the gallery
- **WHEN** screenshots are generated
- **THEN** the View settings dialog is represented, every PNG is visually reviewed, and repeated generation has identical hashes

#### Scenario: Convert the configured database offline
- **WHEN** the explicitly authorized current database is converted with its process stopped
- **THEN** a consistent backup precedes production validation and one revision-incrementing transaction, failure leaves the original unchanged, already-current data is a no-op, and no database or temporary tool enters Git


## MODIFIED Requirements

### Requirement: Validation covers catalog ordering and Unit grouping
Repository validation SHALL cover atomic pointer and keyboard Tag moves, filtered insertion and cancellation, scrollable nested color presets, conditional dated counts, strict grouping state, earliest-Tag grouping, boss placement, View-local history and copying, manual and Live membership, ordered output, both runtime persistence paths, accessibility, localization, and bounded derivation. The 59-frame deterministic gallery SHALL include View settings with default-enabled grouping and Tag cloud switches plus distribution colors and catalog rows with leading reorder handles. README SHALL retain ten featured frames.

#### Scenario: Validate ordered presentation in both runtimes
- **WHEN** users reorder Tags and toggle View grouping in browser validation
- **THEN** the catalog and Employee Tag surfaces retain the global sequence, each Employee appears once in the expected canvas and PNG sequence, and SQLite reload or live-tab exchange preserves the result without unexpected diagnostics

#### Scenario: Validate the current-only state boundary
- **WHEN** a View omits settings or supplies invalid settings
- **THEN** the complete state is rejected without mutation and the runtime does not migrate it

#### Scenario: Regenerate settings and catalog frames
- **WHEN** the gallery is generated twice from unchanged source and fixtures
- **THEN** all 59 PNG hashes match and the new settings frame shows the View display switches and distribution color fields
