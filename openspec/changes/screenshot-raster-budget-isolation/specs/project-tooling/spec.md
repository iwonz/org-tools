## MODIFIED Requirements

### Requirement: Screenshot capture waits for observed visual stability
The maintained gallery SHALL wait for bundled fonts and current embedded images to finish loading or reach an explicit error state, disable transient animation, and require two consecutive bounded visual samples to match before accepting each PNG. Ordinary small-delta pixels and pixels inside explicitly marked raster-noise regions MUST each use the unchanged 256-pixel budget independently. Ordinary channel deltas above three MUST fail outside an explicit raster-noise region. Failure to stabilize MUST fail the gallery and retain diagnostic samples. The complete validation lifecycle SHALL still generate all 56 frames twice and compare every SHA-256 hash.

#### Scenario: Stable resources replace a fixed delay
- **WHEN** fonts and images become ready and two consecutive samples match
- **THEN** capture proceeds immediately without waiting for a fixed per-frame sleep

#### Scenario: Late visual update is not accepted
- **WHEN** a frame changes after the first sample beyond either bounded pixel category
- **THEN** capture continues sampling within the bounded attempt limit instead of storing the unstable frame

#### Scenario: Independent bounded noise categories
- **WHEN** ordinary antialiasing and a declared raster-noise region each remain within 256 changed pixels
- **THEN** neither category consumes the other category's allowance and the visual samples match

#### Scenario: Frame never stabilizes
- **WHEN** no consecutive visual samples match within the bounded attempt limit
- **THEN** the gallery fails with the scenario identifier and retains the final samples as diagnostics

#### Scenario: Complete evidence remains authoritative
- **WHEN** continuous validation runs from unchanged source and fixtures
- **THEN** it still produces two complete 56-frame passes and requires all resulting SHA-256 hashes to match
