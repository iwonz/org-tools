## Why

The authenticated PostgreSQL server is the only supported Org Tools runtime, but the repository and
GitHub settings still retain obsolete GitHub Pages terminology, static-export exclusions, and an
active public Pages site. Keeping that unused delivery surface is misleading and leaves an
unnecessary public deployment enabled.

## What Changes

- **BREAKING** Remove GitHub Pages as a supported runtime and deployment surface; Org Tools is
  available only through the self-hosted server image and Compose or Docker Run workflows.
- Remove residual Pages/static-export paths from TypeScript, Biome, Git, Docker build-context, test,
  CI, documentation, and capability contracts.
- Disable the repository's active GitHub Pages site and remove its `github-pages` environment after
  the server-only change reaches `main`.
- Keep historical GitHub deployment records and archived OpenSpec changes as immutable project
  history, while ensuring they cannot drive a current build or deployment.
- Preserve the current application State, PostgreSQL schema, locales, screenshots, GHCR delivery,
  Release Please, and authenticated browser coverage.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Make validation, browser coverage, automation, and documentation explicitly
  server-only and remove Pages publication requirements.
- `single-state-runtime`: Replace the obsolete exclusion wording with an affirmative single-server
  runtime boundary.
- `organization-views`: Require canvas commands to persist through the authenticated server only.
- `organization-editor`: Remove Pages from the large Editor performance runtime matrix.
- `privacy-safety`: Remove Pages-only privacy scenarios while retaining the stronger authenticated
  server data boundary.

## Impact

Affected files are repository configuration, screenshot TypeScript configuration, canonical
OpenSpec capabilities, validation contracts, and GitHub repository deployment settings. No product
API, State shape, database migration, localization string, screenshot scenario, or runtime UI
changes.
