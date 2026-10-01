## Context

All supported development and validation commands run in the Compose toolbox. On GitHub's Linux
runner the bind-mounted `/workspace` checkout is owned by the runner UID while the toolbox process
runs as container root. Modern Git rejects repositories owned by another UID unless the path is
explicitly trusted, so `public:check` fails before it can inspect tracked files. Docker Desktop does
not reproduce this ownership boundary, which is why the local scan succeeds.

The setting affects repository metadata access only. It does not expose organization data, alter
the checkout, or change the production image.

## Goals / Non-Goals

**Goals:**

- Allow repository-aware validation commands to run in the Linux toolbox.
- Trust exactly the toolbox's fixed `/workspace` bind target.
- Keep the trust declaration process-scoped and regression-tested.
- Preserve production runtime hardening and Git configuration.

**Non-Goals:**

- Trust arbitrary directories or disable Git ownership checks globally.
- Change the app, PostgreSQL, State, Backup, or release artifacts.
- Add a host prerequisite or modify a user's Git configuration.

## Decisions

### Use Git's process environment configuration in the toolbox service

The toolbox will set `GIT_CONFIG_COUNT=1`, `GIT_CONFIG_KEY_0=safe.directory`, and
`GIT_CONFIG_VALUE_0=/workspace`. Git treats these as command-process configuration for the toolbox
and its children. Nothing is written to the host checkout, image, or a global config file.

Running `git config --global` during image build was rejected because it would bake trust into every
development-image consumer and create mutable global state. Passing `-c safe.directory=/workspace`
to `public:check` alone was rejected because other documented toolbox commands may legitimately use
Git. Trusting `*` was rejected because the toolbox has exactly one supported repository bind target.

### Extend the existing Compose security contract test

The test will assert the three environment entries appear only in the toolbox service and that the
trusted value is exactly `/workspace`. The existing production assertions remain unchanged. The real
`public:check` command in the Compose toolbox is the integration proof.

## Risks / Trade-offs

- **Any repository mounted at `/workspace` is trusted inside the toolbox process** -> The path is the
  documented fixed checkout mount and the toolbox is a developer-operated container, not the web runtime.
- **Git environment variable ordering is error-prone** -> The regression test pins count, key, and value
  together, and CI executes a repository-aware scan before publication.

## Migration Plan

Recreating the toolbox applies the environment. No data or `.env` migration is required. Rollback
removes the three toolbox environment entries and restores Git's default ownership refusal.

## Open Questions

None.
