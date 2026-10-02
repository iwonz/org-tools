## MODIFIED Requirements

### Requirement: Views own isolated canvas elements
Every system or custom View SHALL own an ordered canvas-element document independent from every
other View. Canvas elements SHALL participate in View-local history, revision-checked PostgreSQL
persistence, server event refresh, and complete View cloning. View UI selection MAY reference only
elements belonging to that View.

#### Scenario: Create or copy a View
- **WHEN** a blank View is created or a complete View is copied
- **THEN** the blank View receives an empty element array and the copy receives equivalent elements
  with regenerated element and Unit IDs plus remapped internal anchors

#### Scenario: Synchronize an element command
- **WHEN** a canvas element command commits through the authenticated server
- **THEN** the active View persists in PostgreSQL and authorized clients refresh without changing
  another View
