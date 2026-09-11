## ADDED Requirements

### Requirement: Development launcher observes the complete child lifecycle
The development launcher SHALL observe Next.js completion from spawn onward and reuse that result
through warmup, normal running, and shutdown. It SHALL cancel pending probes and delays on child
completion, startup deadline, or interruption, and SHALL NOT report a terminated child as ready or
wait for an already-emitted event. Diagnostics SHALL remain bounded and local.

#### Scenario: Child exits during warmup
- **WHEN** Next.js exits before readiness, including after responding to the state API during the settling delay
- **THEN** the launcher reports startup failure with the child exit detail, exits unsuccessfully, and emits neither readiness nor an unsettled top-level await warning

#### Scenario: Child exits after readiness
- **WHEN** a running Next.js process exits
- **THEN** the launcher completes promptly with its numeric exit code or an unsuccessful signal result, without an unsettled top-level await warning

#### Scenario: Child fails to spawn
- **WHEN** the child process emits a spawn error
- **THEN** the launcher reveals bounded diagnostics and terminates unsuccessfully without an unhandled error or unresolved completion waiter

#### Scenario: Contributor interrupts the launcher
- **WHEN** the launcher receives SIGINT or SIGTERM during probing or normal operation
- **THEN** it cancels startup work, stops its owned child with bounded escalation, and terminates cleanly
