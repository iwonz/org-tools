## ADDED Requirements

### Requirement: Development readiness checks are bounded and diagnosable

The Compose development validation wrapper SHALL bound each readiness request and the aggregate
readiness window. If readiness is not established, it SHALL terminate nonzero and print app service
status and bounded recent app logs without printing environment secrets.

#### Scenario: Development app becomes ready

- **WHEN** the app returns a successful ready response within the bounded retry window
- **THEN** the wrapper starts the Chromium probe and completes normally

#### Scenario: Development readiness stalls

- **WHEN** a ready request stalls or the app never becomes ready before the retry window ends
- **THEN** the request is aborted, the wrapper exits nonzero, and app diagnostics are emitted within the CI job timeout
