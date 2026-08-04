## ADDED Requirements

### Requirement: OpenSpec governs repository changes
The repository SHALL include the Codex OpenSpec integration, English project context, strict validation, and archived capability specifications.

#### Scenario: Specification validation
- **WHEN** `pnpm spec:validate` runs
- **THEN** all active changes and main specs pass strict non-interactive validation

#### Scenario: Telemetry-free specification commands
- **WHEN** a contributor runs OpenSpec through `pnpm spec -- ...`
- **THEN** the repository wrapper applies the CLI's documented telemetry opt-out variables

### Requirement: Documentation and automation are publication-ready
The repository SHALL include an English README, contributor and security guidance, license, CI, synthetic fixtures, browser smoke tests, and PNG screenshots without demo video.

#### Scenario: Continuous validation
- **WHEN** the CI workflow runs on a clean checkout
- **THEN** install, lint, typecheck, tests, build, OpenSpec validation, and public-safety checks complete successfully

#### Scenario: Screenshot generation
- **WHEN** the screenshot command runs against the production build
- **THEN** deterministic English PNG screenshots are generated from local synthetic data
