## ADDED Requirements

### Requirement: Distribution mode follows View UI lifecycle
Each View SHALL own a unique set of enabled distribution Unit IDs. Copying a complete View SHALL
remap its enabled IDs to cloned Units, while blank View creation and cross-View Unit Paste SHALL
leave newly created or pasted Units disabled.

#### Scenario: Clone an enabled View
- **WHEN** a View containing enabled distribution Units is copied
- **THEN** corresponding cloned Units are enabled through their regenerated IDs

#### Scenario: Paste an enabled source Unit
- **WHEN** a Unit copied from another View is pasted
- **THEN** the pasted Unit does not inherit the source View's distribution mode

#### Scenario: Delete an enabled Unit
- **WHEN** an enabled Unit is removed through any deletion entry point
- **THEN** its ID is removed from View UI before the complete state is validated or persisted
