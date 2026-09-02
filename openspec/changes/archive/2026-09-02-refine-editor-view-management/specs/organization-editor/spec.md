## ADDED Requirements

### Requirement: Canonical and custom Views have a safe management lifecycle
The Editor SHALL present its canonical View with the same localized product term as the Units
destination while retaining the internal main-kind contract. The canonical View MUST NOT expose
Rename or Delete. Every active custom View SHALL expose Rename and Delete whether its canvas is
populated or empty. Delete SHALL require explicit confirmation, remove only that custom View, select
the canonical View when the deleted View was active, remove deleted per-View UI state, and replace a
deleted Download source with the canonical View without changing canonical organization data.

#### Scenario: Canonical View presentation and protection
- **WHEN** the canonical View is active in either supported locale
- **THEN** its selector label uses the localized Units destination term
- **AND** Rename and Delete controls are absent

#### Scenario: Empty custom View management
- **WHEN** an empty custom View is active
- **THEN** accessible Rename and Delete controls remain available in the View toolbar

#### Scenario: Cancel custom View deletion
- **WHEN** the user opens Delete for a custom View and cancels the confirmation
- **THEN** the View, its document, active selection, durable UI, and Download source remain unchanged

#### Scenario: Confirm custom View deletion
- **WHEN** the user confirms deletion of an active custom View
- **THEN** exactly that View and its per-View UI are removed and the canonical View becomes active
- **AND** canonical Employees, Units, and other custom Views remain unchanged

#### Scenario: Delete the active Download source
- **WHEN** a custom View selected as the Download source is deleted
- **THEN** the Download source becomes the canonical View and no strict state contains the deleted View ID

#### Scenario: Attempt canonical View deletion
- **WHEN** a deletion request targets the canonical View outside the toolbar
- **THEN** the store rejects the mutation without changing organization or UI state
