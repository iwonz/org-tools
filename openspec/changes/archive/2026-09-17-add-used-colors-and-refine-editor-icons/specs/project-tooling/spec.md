## ADDED Requirements

### Requirement: Browser and gallery checks cover organization color reuse and refined tool glyphs

Automated Server and Pages checks SHALL verify Used colors across every shared picker consumer,
including inactive-View sources, alpha variants, atomic Apply/Cancel behavior, keyboard operation,
narrow width, and RTL. The maintained deterministic gallery SHALL show the Used colors section and
the refined Arrow and Image icons without increasing its 59 scenarios.

#### Scenario: Validate every shared picker consumer

- **WHEN** browser validation opens Tag, distribution, open-position, Text, Sticker, and Arrow color controls
- **THEN** each exposes the same organization-wide Used colors and reuses a swatch only through Apply

#### Scenario: Validate refined toolbar icons

- **WHEN** browser validation inspects the Editor tool surface
- **THEN** the Arrow SVG has one cubic path plus a filled end triangle, the Image tool uses the rounded photo glyph, and both retain their accessible names

#### Scenario: Regenerate maintained screenshots

- **WHEN** the 59-frame gallery is generated twice from unchanged source
- **THEN** affected color-picker and Editor frames show the new section and icons and both SHA-256 manifests match
