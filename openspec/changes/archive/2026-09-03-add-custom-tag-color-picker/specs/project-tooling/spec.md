## MODIFIED Requirements

### Requirement: Gallery verifies Tag fill semantics
The deterministic screenshot gallery SHALL show named and arbitrary Tag colors as readable filled
surfaces without separate leading color dots in representative Employee, Tag catalog, Calendar, and
assignment workflows. The Tag catalog editor frame SHALL show the full palette above the localized
named preset list.

#### Scenario: Regenerate Tag-bearing frames
- **WHEN** the maintained gallery is generated twice from unchanged source
- **THEN** affected Tag-bearing PNGs show the named and arbitrary filled treatments, full palette dropdown, and identical hash manifests

#### Scenario: Validate custom color behavior
- **WHEN** browser validation chooses an arbitrary Tag color in both themes and both runtimes
- **THEN** every resolved Tag surface uses the same readable fill without console, network, or geometry diagnostics
