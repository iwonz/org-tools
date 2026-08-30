# state-transfer Specification

## Purpose
Define strict complete-state Import and immediate complete-state Export.

## Requirements

### Requirement: Import replaces one complete current state atomically
The global Import action SHALL accept only a strictly valid current `OrgToolsState` no larger than
25 MiB and SHALL replace current memory only after explicit destructive confirmation. The dialog
SHALL show filename, file size, and Employee, Unit, and View counts, allow another file, localize all
copy, and leave state unchanged after invalid input or cancellation. Server mode SHALL enqueue an
atomic all-scope write and Pages SHALL broadcast the accepted replacement to live tabs.

#### Scenario: Confirm valid state
- **WHEN** a user selects a valid complete file and confirms replacement
- **THEN** organization and durable UI install atomically, including locale and theme, and the
  runtime immediately schedules its normal persistence or synchronization behavior

#### Scenario: Reject unsupported input
- **WHEN** a selected file is malformed, oversized, partial, arbitrary JSON, or uses an obsolete
  contract
- **THEN** a localized owned error and Choose another file remain available while current state is
  unchanged

#### Scenario: Cancel replacement
- **WHEN** file selection or confirmation is canceled
- **THEN** current memory, SQLite, and other live tabs are unchanged

### Requirement: Export downloads the complete live state immediately
The global Export action SHALL create and strictly validate the current complete state and download
it as `org-tools-state.json` without a content selector, Save dependency, confirmation dialog, or
success banner. Reporting exports from Download SHALL remain separate and SHALL NOT be accepted by
Import.

#### Scenario: Direct state Export
- **WHEN** a user activates Export
- **THEN** one current `{ organization, ui }` JSON document downloads immediately without changing
  runtime state

#### Scenario: Export validation failure
- **WHEN** the live state cannot pass the production parser
- **THEN** no file downloads and the shell presents a localized owned error
