## Why

The image workflow publishes a valid public multi-platform package, then reports failure because a
repository-scoped `GITHUB_TOKEN` cannot call GitHub's user-scoped package visibility endpoint. The
published package already passes an anonymous pull, so the administrative call is both ineffective
and a false delivery failure.

## What Changes

- Remove the user-scoped package visibility API call from the Container workflow.
- Keep package publication under the minimal repository workflow permissions.
- Verify public availability through an anonymous registry pull after publication.
- Do not change the image, application, State, PostgreSQL data, or product UI.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `container-delivery`: Clarify that the workflow uses repository-scoped publication permissions
  and verifies public visibility without invoking a user-scoped administrative API.

## Impact

The change affects the GHCR workflow and its container-delivery contract only. It has no privacy,
compatibility, localization, database, or user-visible product impact.
