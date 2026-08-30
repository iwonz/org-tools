# public-showcase Specification

## Purpose
Define the data-free GitHub Pages product showcase, deterministic artifact, and explicit publication
workflow without changing the local application boundary.

## Requirements

### Requirement: Public showcase represents the local product accurately
The repository SHALL generate a static public showcase from reviewed English repository copy and
every manifest-declared synthetic screenshot, SHALL identify the page as a showcase rather than a
hosted Org Tools application, and SHALL direct functional use to the documented local Node.js
runtime.

#### Scenario: Visitor opens the public page
- **WHEN** the deployed GitHub Pages root is opened
- **THEN** it explains the local privacy model, presents the complete feature gallery, links to the
  source and local-run instructions, and does not offer a non-functional hosted editor

#### Scenario: Capability gallery changes
- **WHEN** a manifest screenshot is added, removed, renamed, or reordered
- **THEN** the next Pages build reflects the manifest exactly or fails before publication when the
  corresponding synthetic PNG is unavailable

### Requirement: Public artifact is deterministic and data-free
The Pages artifact SHALL contain only generated static HTML, repository-owned presentation, and
manifest-declared synthetic PNGs, SHALL contain no organization workspace, SQLite file, secret,
local path, executable script, telemetry, remote asset, form submission, or project API request, and
SHALL remain ignored by Git.

#### Scenario: Build the Pages artifact
- **WHEN** `pnpm pages:build` runs from a valid checkout
- **THEN** it replaces the ignored output with a deterministic `index.html`, `.nojekyll`, and the
  exact manifest screenshot set without changing tracked files

#### Scenario: Unsafe generated content
- **WHEN** publication checks inspect a Pages artifact containing a forbidden file, remote resource,
  executable script, secret pattern, local path, or screenshot outside the manifest
- **THEN** validation fails before the artifact can be deployed

### Requirement: Pages publication is explicit and reproducible
The repository SHALL provide an explicit publication command and a manually dispatched GitHub
Actions workflow that builds, validates, uploads, and deploys the Pages artifact with least-privilege
permissions.

#### Scenario: Publish synchronized main
- **WHEN** an authenticated maintainer runs `pnpm pages:publish` from clean `main` with local and
  remote revisions equal
- **THEN** the command dispatches the versioned Pages workflow for `main` and reports how to monitor
  the deployment

#### Scenario: Reject stale publication
- **WHEN** the publication command runs from another branch, a dirty worktree, or a revision that
  differs from `origin/main`
- **THEN** it fails without dispatching a deployment
