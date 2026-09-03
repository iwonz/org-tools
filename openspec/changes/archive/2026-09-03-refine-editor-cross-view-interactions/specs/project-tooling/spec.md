## ADDED Requirements

### Requirement: Gallery and browser checks cover refined cross-View interactions
The maintained 52-frame deterministic gallery SHALL keep the same scenario set while updating the
Editor View, clipboard, and Unit footer frames. Browser validation SHALL exercise cross-View paste,
all four edge-pan drag modes, nested and multi-selection deletion, and tooltip absence in both server
and Pages runtimes without console, page, resource, or external-network diagnostics.

#### Scenario: Regenerate affected Editor frames
- **WHEN** the 52-frame gallery is generated twice from unchanged source and fixtures
- **THEN** complete wrapping footer Tags and the current View interactions appear with identical SHA-256 manifests

#### Scenario: Validate large interaction performance
- **WHEN** edge-pan and deletion are exercised with 20,000 Employees and 4,000 Units
- **THEN** no drag frame serializes organization state or performs a complete Unit scan and release creates at most one viewport commit and one structural command
