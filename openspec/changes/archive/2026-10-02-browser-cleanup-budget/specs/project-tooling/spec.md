## ADDED Requirements

### Requirement: Stateful browser scenarios reserve bounded cleanup time
Browser scenarios that mutate shared test state MUST keep their product assertions under the normal
scenario deadline and MUST reserve a separate bounded cleanup interval for baseline restoration.
Cleanup failure MUST fail the scenario without leaving later tests to run against partial state or
an active maintenance operation.

#### Scenario: Assertions finish near the scenario deadline
- **WHEN** a stateful browser scenario enters mandatory cleanup after consuming most of its assertion budget
- **THEN** baseline restoration receives its bounded cleanup interval and later tests start from the validated baseline

#### Scenario: A product assertion exceeds its deadline
- **WHEN** the scenario body reaches the product assertion timeout
- **THEN** the scenario remains failed while its bounded cleanup is still allowed to restore the baseline
