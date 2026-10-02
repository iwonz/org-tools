## ADDED Requirements

### Requirement: Current repository excludes GitHub Pages delivery
The current repository SHALL contain no GitHub Pages application, static-export build path,
deployment workflow, Pages action, Pages permission, Pages environment, or browser-only test
configuration. The authenticated server image SHALL be the only production runtime. Historical
OpenSpec archives and Git history MAY retain completed Pages records.

#### Scenario: Validate current repository source
- **WHEN** unit and publication checks inspect current workspace configuration and workflows
- **THEN** no executable or configured GitHub Pages delivery surface is present

#### Scenario: Complete server-only delivery
- **WHEN** the server-only change reaches `main`
- **THEN** the repository Pages site and `github-pages` environment are absent
- **AND** CI, Release Please, and GHCR publication remain configured

## MODIFIED Requirements

### Requirement: Public automation uses supported action runtimes
Repository CI, Release, and Container workflows SHALL use maintained official action major versions
whose declared inputs are supported and whose JavaScript runtimes are accepted by GitHub-hosted
runners without deprecation annotations.

#### Scenario: CI workflow starts
- **WHEN** GitHub runs the repository validation workflow on a clean checkout
- **THEN** checkout, Buildx, screenshot artifact upload, and other workflow actions execute on their
  maintained runtimes without deprecated-runtime annotations

#### Scenario: Release and container workflows start
- **WHEN** GitHub runs Release Please or publishes a main or SemVer container image
- **THEN** release, metadata, build, registry, SBOM, and provenance actions use supported majors and
  accepted inputs without deprecated-runtime or unexpected-input annotations

## REMOVED Requirements

### Requirement: Server and image validation replace Pages validation
**Reason**: Pages is no longer a supported runtime or comparison target, so the historical
replacement wording is obsolete.

**Migration**: Use the authenticated server browser suite, PostgreSQL-backed CI, production image
inspection, and the new current-repository exclusion requirement.

## ADDED Requirements

### Requirement: Server and image validation cover delivery
CI SHALL start ephemeral PostgreSQL, run checked migrations, exercise Setup/Login and representative
roles, build the hardened server image, run unit and authenticated browser suites, generate exactly
56 server PNGs twice, compare hashes, and scan tracked files, build context, image layers, and
runtime resources.

#### Scenario: Continuous validation
- **WHEN** CI runs for a pull request
- **THEN** all server, authorization, PostgreSQL, image, locale, gallery, performance, OpenSpec, and
  publication-safety checks pass without publishing an image
