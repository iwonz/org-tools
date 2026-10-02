## Context

The Release workflow uses Release Please with the repository `GITHUB_TOKEN`. GitHub deliberately
suppresses most new workflow runs caused by events emitted with that token. The action can create a
valid SemVer tag and GitHub Release, but the tag push does not start the independent Container
workflow that owns GHCR publication.

The Container workflow already derives `X.Y.Z`, `X.Y`, `X`, and `latest` from `github.ref`, publishes
both supported architectures, and attaches SBOM and provenance. Reusing it avoids a second image
publication implementation.

## Goals / Non-Goals

**Goals:**

- Start the existing Container workflow for the exact Release Please tag.
- Preserve least-privilege repository token defaults and avoid long-lived user credentials.
- Keep release image metadata, verification, caching, and attestations in one workflow.
- Make a failed dispatch visible as a failed Release workflow.

**Non-Goals:**

- Automatically approve CI, merge release PRs, or remove the human release gate.
- Replace Release Please or change conventional-commit version calculation.
- Change application code, State, data, or container contents.

## Decisions

1. **Use `workflow_dispatch` with the released tag as its ref.** GitHub documents
   `workflow_dispatch` as an exception to recursive `GITHUB_TOKEN` suppression. The Container
   workflow gains that trigger, and Release invokes it only when Release Please reports
   `release_created`. This keeps `github.ref` tag-shaped so the existing metadata action produces
   stable version tags.
2. **Grant `actions: write` only to the Release workflow.** Repository default permissions remain
   read-only. Container retains its current `contents`, `packages`, attestation, and identity
   permissions.
3. **Do not use a PAT.** A personal token would also make generated PR and tag events trigger other
   workflows, but adds an expiring user-bound secret with broader operational ownership. Manual CI
   approval for the generated release PR remains an explicit review gate.
4. **Keep push triggers.** `main` continues to publish `edge` and `sha-*`; a tag created by a human
   or another trusted mechanism can still publish directly. The explicit dispatch covers the
   Release Please token path.

## Risks / Trade-offs

- **A future non-default Release Please token could make both tag push and explicit dispatch run.**
  → Keep the repository-token design documented; remove the explicit dispatch if publication later
  moves to a GitHub App whose events trigger workflows.
- **Dispatch acceptance does not mean the Container run succeeded.** → The Container workflow
  remains independently visible and reports its own build, registry, SBOM, provenance, and
  anonymous-pull result. Release documentation requires checking that run before considering the
  release complete.
- **A missing tag or disabled workflow makes dispatch fail.** → Dispatch targets the action-provided
  `tag_name` and the Release workflow fails immediately when GitHub rejects the request.
