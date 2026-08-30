## ADDED Requirements

### Requirement: Package-manager startup is reproducible
The repository SHALL declare exact pnpm 11.24.0 selection through `packageManager`, SHALL keep local
and CI commands aligned with that declaration, and SHALL allow a Corepack-selected matching pnpm to
run `pnpm dev` without a package-manager version-policy failure.

#### Scenario: Corepack development startup
- **WHEN** Corepack invokes pnpm 11.24.0 from the repository root and a contributor runs `pnpm dev`
- **THEN** package-manager validation succeeds and the documented development launcher starts

#### Scenario: Frozen dependency graph
- **WHEN** pnpm 11.24.0 validates or installs the repository with the frozen lockfile
- **THEN** it accepts the committed dependency graph without an unrelated resolution rewrite

#### Scenario: CI package-manager selection
- **WHEN** GitHub automation installs the package manager declared by the repository
- **THEN** it selects pnpm 11.24.0 before dependency installation and repository commands
