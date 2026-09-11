## Why

The development launcher can miss a Next.js exit while warming the application, report readiness,
and then terminate with Node's unsettled top-level await warning and exit code 13. Contributors need
reliable startup diagnostics and process completion even when the server stops during initialization.

## What Changes

- Observe child completion immediately and reuse it throughout startup, running, and shutdown.
- Cancel pending warmup requests when the child exits or startup expires; never announce a stopped server as ready.
- Add isolated subprocess regression coverage for early exit, warmup exit, running exit, and shutdown.
- Document the launcher lifecycle and complete the repository validation and delivery workflow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Development startup and termination remain bounded and cannot miss child completion.

## Impact

Affected areas are development scripts, their regression tests, and tooling documentation. There are
no new dependencies, state or export changes, or privacy changes; probes remain loopback-only.
Product UI, translations, organization data, and automatic process restart are explicit non-goals.
