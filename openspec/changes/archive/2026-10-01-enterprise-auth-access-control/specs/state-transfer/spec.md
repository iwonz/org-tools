## REMOVED Requirements

### Requirement: Import supports complete State and mapped Employees
**Reason**: Complete State and Employee Import are removed from the authenticated server product.
**Migration**: Use encrypted Restore for complete administrative recovery and ordinary product forms/commands for Employees.

### Requirement: Export selects complete State or flat Employees
**Reason**: Direct complete-State export is unsafe and the Employee transfer mode is removed.
**Migration**: Use encrypted Backup for complete recovery and permission-filtered Data Download for user output.

### Requirement: Employee duplicate policies are bulk-selectable and individually overridable
**Reason**: Employee Import is removed.
**Migration**: Resolve Employee creation and identity changes through authorized Employee workflows.

### Requirement: Team assignment Import is mapping-driven and additive
**Reason**: Employee Import is removed.
**Migration**: Manage assignments through authorized Employee and Unit commands.

### Requirement: Large Employee transfer remains bounded
**Reason**: Employee Import and its review surface are removed.
**Migration**: The 20,000-Employee target remains required for projections, filters, and Download.

### Requirement: Mapped Tag Import ignores color
**Reason**: Employee Import is removed.
**Migration**: Create and assign Tags through authorized catalog and assignment workflows.

### Requirement: Employee transfer enforces complete birthday values
**Reason**: Employee Import is removed.
**Migration**: Employee commands and Restore enforce the canonical birthday parser.

### Requirement: State transfer uses only the strict View state
**Reason**: Complete State transfer is removed.
**Migration**: Encrypted Backup contains the current strict organization document.

### Requirement: Complete State transfer requires Unit notes
**Reason**: Complete State transfer is removed.
**Migration**: Backup and Restore validate current Unit notes.

### Requirement: Complete State requires distribution View UI
**Reason**: Complete State transfer is removed.
**Migration**: Backup includes current per-account UI state.

### Requirement: Complete state requires View settings
**Reason**: Complete State transfer is removed.
**Migration**: Backup validates current View settings.

### Requirement: Complete State requires exact canvas elements
**Reason**: Complete State transfer is removed.
**Migration**: Backup validates current canvas elements.

### Requirement: Employee Import maps advanced custom values
**Reason**: Employee Import is removed.
**Migration**: Custom values are edited through the authorized Employee form and preserved by Backup.

### Requirement: Complete State uses only the current advanced-field shape
**Reason**: Complete State transfer is removed.
**Migration**: The organization parser and Backup accept only the current advanced-field shape.

### Requirement: Complete State requires Employee display formats
**Reason**: Complete State transfer is removed.
**Migration**: Backup preserves and validates current display formats.

### Requirement: New State has stable Employee display defaults
**Reason**: Users no longer create a complete State file.
**Migration**: A new organization document uses the same locale-specific display defaults.

### Requirement: Current State persists exact Staffing Slot data
**Reason**: The complete State contract is removed.
**Migration**: The organization document and Backup preserve exact Staffing Slot data.

### Requirement: Employee-oriented projections exclude Staffing Slots
**Reason**: Employee Import projections are removed.
**Migration**: Data Download remains Employee-oriented and continues to exclude Staffing Slots unless its own format explicitly supports them.

## ADDED Requirements

### Requirement: Legacy State and Employee transfer surfaces are absent
The shell, routes, parsers, fixtures, messages, tests, and documentation SHALL NOT expose complete
State Import/Export or mapped Employee Import. Complete recovery SHALL use encrypted Backup/Restore,
while Data Download and Editor export SHALL remain permission-filtered product outputs.

#### Scenario: Inspect global transfer actions
- **WHEN** an authenticated user opens the shell
- **THEN** no State Import, State Export, Employee Import, mapping, duplicate-review, or related action is available

#### Scenario: Submit a legacy State file
- **WHEN** a caller uploads legacy State JSON to any supported route
- **THEN** it is rejected without parsing it as Backup or changing organization data

