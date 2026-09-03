## MODIFIED Requirements

### Requirement: Gallery verifies Tag fill semantics
The deterministic screenshot gallery SHALL show named and arbitrary Tag colors as readable filled
surfaces without separate leading color dots in representative Employee, Tag catalog, Calendar, and
assignment workflows. The Tag catalog editor frame SHALL show the dedicated edit dialog with the
full palette, exact typed color editor, and localized named preset list. The maintained Template
token frame SHALL show the Format help affordance and its localized guidance.

#### Scenario: Regenerate Tag-bearing frames
- **WHEN** the maintained gallery is generated twice from unchanged source
- **THEN** affected Tag-bearing PNGs show the named and arbitrary filled treatments, modal editor, exact color entry, full palette dropdown, and identical hash manifests

#### Scenario: Validate exact custom color behavior
- **WHEN** browser validation enters HTML Keyword, HEX, RGB, and RGBA colors in both runtimes
- **THEN** each valid input resolves to its canonical color, invalid input preserves the previous draft, and no console, network, or geometry diagnostic occurs

#### Scenario: Validate Format guidance
- **WHEN** browser validation visits each token-aware Format surface
- **THEN** a help icon follows the label and exposes localized `@` guidance on hover and keyboard focus
