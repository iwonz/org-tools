## ADDED Requirements

### Requirement: GHCR publication avoids user-scoped administration

The Container workflow SHALL publish with repository-scoped package permissions and SHALL NOT use a
personal token or call a user-scoped package administration endpoint. Stable delivery SHALL verify
public visibility using an anonymous registry client.

#### Scenario: Publish from main or a release tag

- **WHEN** the repository workflow publishes a valid multi-platform manifest with `packages: write`
- **THEN** it completes after build, push, SBOM, and provenance without a user-package visibility call

#### Scenario: Verify public registry access

- **WHEN** stable delivery is checked with an empty Docker client configuration
- **THEN** the SemVer image pulls without authentication or cached credentials
