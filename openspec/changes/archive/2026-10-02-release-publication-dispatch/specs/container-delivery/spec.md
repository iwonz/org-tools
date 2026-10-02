## MODIFIED Requirements

### Requirement: SemVer releases publish verified public GHCR images
Release Please SHALL maintain the root version, CHANGELOG, release PR, SemVer tag, and GitHub Release.
The first stable release SHALL be `v1.0.0`. Main commits SHALL publish public `edge` and commit tags;
stable releases SHALL publish full, minor, major, and `latest` tags for Linux amd64 and arm64. Images
SHALL include OCI metadata, SBOM, and GitHub provenance, and `latest` SHALL never follow unreleased main.
When Release Please creates a stable release with the repository token, the Release workflow MUST
explicitly dispatch the Container workflow for the exact created tag so token event suppression
cannot omit the versioned image.

#### Scenario: Publish a stable release
- **WHEN** a passing Release Please PR is merged and creates a SemVer release
- **THEN** the Release workflow dispatches Container for that exact tag
- **AND** the matching public multi-platform tags, release notes, SBOM, and provenance are available

#### Scenario: Validate a pull request
- **WHEN** CI runs for a pull request
- **THEN** it builds and tests the production image without publishing any registry tag

#### Scenario: No release is created
- **WHEN** Release Please completes without a new stable release
- **THEN** the Release workflow does not dispatch a versioned Container publication
