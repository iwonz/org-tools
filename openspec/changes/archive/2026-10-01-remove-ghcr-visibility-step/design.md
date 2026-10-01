## Context

`docker/build-push-action` successfully publishes the manifest and provenance with the workflow's
repository-scoped token. The following step calls `/user/packages/...`, but a GitHub Actions token
has no user identity for that endpoint and receives 404. The package is already public and an
anonymous Docker client can pull `edge`.

## Goals / Non-Goals

**Goals:**

- Let a successful image publication complete without an unrelated user-administration failure.
- Retain minimal workflow permissions and prove public access from an unauthenticated client.

**Non-Goals:**

- Add a personal access token or broaden Actions permissions.
- Change image contents, tags, build platforms, SBOM, provenance, or release automation.

## Decisions

- Remove the visibility PATCH step. Package visibility is repository/package configuration, while
  image publication remains the workflow's responsibility.
- Keep `packages: write` as the only package permission. Adding a classic PAT secret was rejected
  because it creates a durable user credential and a broader security boundary.
- Treat a pull with an empty Docker config as the delivery proof. It tests the public registry path
  directly and cannot silently reuse workstation credentials.

## Risks / Trade-offs

- [A future package is created private] → the release checklist fails its anonymous pull and reports
  the exact external configuration that must be corrected; the workflow does not claim success of
  public delivery from an ineffective API call.
