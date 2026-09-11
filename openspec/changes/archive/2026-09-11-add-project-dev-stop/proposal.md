## Why

Contributors need one command to stop every development instance belonging to this checkout,
including instances launched in another terminal or on another port, without affecting other projects.

## What Changes

- Add `pnpm dev-stop` for local macOS and Linux development environments.
- Identify existing server and Pages development process trees by their exact checkout paths and commands.
- Stop gracefully, escalate only verified surviving processes, and succeed when nothing is running.
- Cover multiple instances, unrelated processes, production exclusion, repeated stops, and stubborn children.
- Document the command and complete the repository validation and delivery lifecycle.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Checkout-scoped development shutdown from a separate terminal.

## Impact

Development scripts, package commands, tooling specifications, and contributor documentation change.
No dependencies, state formats, database contents, product copy, or browser behavior change. Process
metadata stays local and is not logged verbatim or persisted. Production shutdown, other checkouts,
Windows process management, and browser-tab management are non-goals.
