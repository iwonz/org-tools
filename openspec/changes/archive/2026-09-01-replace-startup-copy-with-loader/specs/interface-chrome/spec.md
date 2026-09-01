## ADDED Requirements

### Requirement: Initial state loading is quiet and centered
While either runtime resolves its initial state, the application SHALL show one icon-only loading
indicator centered in the viewport on the normal shell background. The indicator SHALL have a
localized accessible status name, SHALL expose no visible loading copy, and SHALL use bundled CSS
and inline SVG with semantic theme tokens without decorative containers, shadows, or remote assets.

#### Scenario: Load initial state
- **WHEN** the SQLite or Pages runtime is waiting for its initial state
- **THEN** one compact circular indicator is centered on both viewport axes without visible text,
  cards, or product branding
- **AND** assistive technology receives the localized loading status

#### Scenario: Prefer reduced motion
- **WHEN** the operating environment requests reduced motion during initial state loading
- **THEN** the indicator remains visually identifiable and centered without requiring rotation

#### Scenario: Finish initial state loading
- **WHEN** the runtime installs a valid initial state or surfaces an explicit startup error
- **THEN** the transient loading indicator is removed without changing state, persistence, or error
  behavior
