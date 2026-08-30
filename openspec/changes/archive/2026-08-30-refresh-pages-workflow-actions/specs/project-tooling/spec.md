## ADDED Requirements

### Requirement: Public automation uses supported action runtimes
Repository CI and Pages publication workflows SHALL use maintained official action major versions
whose declared inputs are supported and whose JavaScript runtimes are accepted by GitHub-hosted
runners without deprecation annotations.

#### Scenario: CI workflow starts
- **WHEN** GitHub runs the repository validation workflow on a clean checkout
- **THEN** checkout, package-manager setup, Node.js setup, and screenshot artifact upload execute on
  their maintained action runtimes without deprecated-runtime annotations

#### Scenario: Pages workflow uploads the complete artifact
- **WHEN** GitHub runs the manually dispatched Pages workflow
- **THEN** configuration, hidden-file artifact upload, and deployment use supported action majors
  and accepted inputs without deprecated-runtime or unexpected-input annotations
