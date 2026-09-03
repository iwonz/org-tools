## ADDED Requirements

### Requirement: Distribution mode uses bounded automatic UI persistence
Changing distribution mode SHALL increment only the UI change sequence and SHALL use the existing
automatic server write or live Pages-tab broadcast. It MUST NOT serialize or mutate organization
data solely because the mode or Employee selection changed.

#### Scenario: Reload server mode
- **WHEN** distribution mode is toggled and the local application reloads after automatic UI write
- **THEN** the same Units remain enabled in the same View

#### Scenario: Synchronize Pages tabs
- **WHEN** one live Pages tab changes distribution mode
- **THEN** another live tab receives the bounded UI setting without browser snapshot persistence
