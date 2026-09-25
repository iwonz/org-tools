## ADDED Requirements

### Requirement: Simplified export controls retain deterministic coverage
Browser smoke tests and the maintained 59-frame gallery SHALL cover the recognizable Arrow icon,
all-assignment Template output, both transient line filters, fixed-density PNG output, simplified
image settings, and the shared solid-background color dropdown in both production runtimes. Gallery
generation SHALL remain deterministic and SHALL add or remove no frames.

#### Scenario: Validate simplified exports
- **WHEN** the full repository validation workflow runs
- **THEN** both runtimes exercise the updated Template and PNG surfaces without obsolete row-mode, density, title, or output-font controls

#### Scenario: Preserve the gallery contract
- **WHEN** screenshots are generated twice from the same commit
- **THEN** exactly 59 PNG files are produced with matching hashes and every updated image is visually reviewed
