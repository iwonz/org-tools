## REMOVED Requirements

### Requirement: Recognized states expose compatible projections
**Reason**: Import now accepts one complete workspace and exposes no projection selector.
**Migration**: Export or use a valid `content: "workspace"` file.

### Requirement: Partial state import supports append and replace-all
**Reason**: Partial append and replacement are removed from the public transfer workflow.
**Migration**: Replace the complete workspace explicitly.

### Requirement: Full workspace import is replacement-only
**Reason**: Complete replacement moves to the `workspace-transfer` capability.
**Migration**: Use the compact workspace Import confirmation.

### Requirement: Every state import is failure-atomic
**Reason**: Failure atomicity moves to the workspace-only capability without projection planning.
**Migration**: Use strict complete-workspace Import.

### Requirement: Import begins with native JSON file selection
**Reason**: File selection moves to the workspace-only capability.
**Migration**: Use the unchanged global Import action.

### Requirement: Replacement import completes without a filename notice
**Reason**: Completion feedback moves to the workspace-only capability.
**Migration**: Confirm the compact replacement dialog.

### Requirement: Partial state operations are visually distinct
**Reason**: Append, partial replacement, and operation cards no longer exist.
**Migration**: Use the single destructive Replace action.

### Requirement: Partial state preview shows normalized hierarchy and Employees
**Reason**: Projection previews are replaced by a compact complete-workspace count summary.
**Migration**: Review the Employee, Unit, and View totals before replacement.
