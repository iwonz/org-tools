## ADDED Requirements

### Requirement: Editor PNG follows persistent View presentation
The Editor PNG renderer SHALL reflect persistent active-View presentation settings and stable Unit
and Employee card semantics by default. A change that adds or modifies persistent View presentation
or stable Unit/Employee card content, styling, visibility, ordering, or status SHALL define and test
the corresponding PNG behavior in the same change. Shared semantic status, geometry, and tonal
primitives SHALL be used where the DOM and canvas renderers require different drawing mechanisms.
The PNG SHALL retain its light export palette and explicit image-only title, background, font,
scope, radius, Employee-format, and boss-label settings. Selection, hover, focus, menus, handles,
placement overlays, and other transient Editor chrome MUST NOT be mirrored.

#### Scenario: Change persistent View presentation
- **WHEN** a persistent View setting changes stable Unit or Employee card presentation
- **THEN** the live Editor and the next PNG preview, copy, or save render the same applicable content, ordering, visibility, status, and card styling

#### Scenario: Change stable card presentation
- **WHEN** stable Unit or Employee card content, geometry, or styling is changed
- **THEN** the same change specifies, implements, and tests its applicable PNG representation through shared semantics

#### Scenario: Apply image-only customization
- **WHEN** the user customizes an explicit Image export setting
- **THEN** that output setting overrides its corresponding PNG attribute without mutating or weakening persistent View presentation parity

#### Scenario: Ignore transient interaction
- **WHEN** hover, focus, selection, menus, handles, or placement overlays are visible on the Editor canvas
- **THEN** PNG output omits those transient states while preserving stable card presentation
