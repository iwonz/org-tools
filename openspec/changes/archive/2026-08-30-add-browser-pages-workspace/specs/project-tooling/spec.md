## ADDED Requirements

### Requirement: Repository validation includes the static browser application
The repository SHALL provide development, static build, inspection, browser-test, and guarded
publication commands for the ignored GitHub Pages application artifact.

#### Scenario: Build Pages application
- **WHEN** `pnpm pages:build` runs
- **THEN** it replaces `pages-out` with the static `/org-tools/` application and `.nojekyll` without
  changing tracked files

#### Scenario: Validate Pages application
- **WHEN** Pages and publication checks inspect the artifact
- **THEN** they reject server modules, project API references, dynamic project routes, secrets, local
  paths, organization fixtures, missing static assets, and an incorrect base path

#### Scenario: Continuous browser validation
- **WHEN** CI runs on a clean checkout
- **THEN** it builds and tests the SQLite server and static browser runtimes before publication

## REMOVED Requirements

### Requirement: Repository validation includes the static showcase

**Reason**: Pages now contains a functional static browser application instead of a showcase artifact.

**Migration**: Use the static browser application build, check, browser-test, and publication commands.
