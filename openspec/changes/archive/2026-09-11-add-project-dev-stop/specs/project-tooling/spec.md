## ADDED Requirements

### Requirement: Development instances can be stopped by checkout
The repository SHALL provide `pnpm dev-stop` on macOS and Linux to stop running server and Pages
development instances of the current checkout, including instances started before the command was
added and instances using different ports. Ownership SHALL require matching checkout paths and a
development command, then follow the owned descendant process tree. Production servers, other
checkouts, unrelated Node processes, and arbitrary port listeners MUST remain running.

#### Scenario: Stop multiple development instances
- **WHEN** a contributor runs `pnpm dev-stop` while this checkout has server and Pages development instances
- **THEN** all discovered development trees receive graceful shutdown and the command waits for completion

#### Scenario: Repeat a stop
- **WHEN** no matching development instances remain
- **THEN** `pnpm dev-stop` reports that nothing is running and exits successfully

#### Scenario: A child survives graceful shutdown
- **WHEN** an owned development worker remains after its parent stops or ignores termination
- **THEN** the command revalidates its observed process identity, applies bounded escalation, and verifies termination

#### Scenario: An unrelated process shares a name or port
- **WHEN** another checkout, a production server, or an unrelated process resembles a development instance
- **THEN** it receives no signal and its files are unchanged

#### Scenario: Discovery or termination fails
- **WHEN** the platform is unsupported, process inspection fails, permissions deny a signal, or verified processes remain
- **THEN** the command exits unsuccessfully with bounded local diagnostics and never broadens its ownership rules
