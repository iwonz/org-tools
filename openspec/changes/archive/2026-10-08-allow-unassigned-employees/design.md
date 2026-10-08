## Context

Employees are global records while every View owns its own Unit assignments. The shared Employee
dialog already submits assignments as an array, and both the store and strict organization parser
accept an empty array. Only the Editor presentation adds a derived `editorTargetMissing` condition
that displays an error and disables submission when that array is empty. Context-menu removal calls
the same assignment mutation with an empty result and therefore succeeds.

## Goals / Non-Goals

**Goals:**

- Make zero assignments a first-class valid state in every Employee form mode.
- Preserve the distinction between removing View-local membership and deleting the global Employee.
- Keep assignment changes atomic, revision checked, permission checked, and isolated to the selected
  View.
- Remove obsolete localized validation copy and document the rule.

**Non-Goals:**

- Automatically assign unassigned Employees to a fallback Unit.
- Change Live Unit derivation, Employee deletion, access scopes, State shape, or PostgreSQL schema.
- Add a separate unassigned-Employee container to the Editor canvas.

## Decisions

1. **Treat the empty assignment array as ordinary valid input.** The dialog will submit `[]` through
   its existing callback instead of maintaining a second removal path. The store already interprets
   absence from every manual Unit as removal from that View and preserves the Employee catalog.
   Keeping this path also retains one organization mutation and Editor history command.
2. **Apply the same rule to system and custom Views.** Global Employee forms already allow the
   state; Editor forms will match them. The active `viewId` remains the assignment boundary, so
   other Views are unchanged.
3. **Keep server authorization based on changed source Units.** Removing the last assignment still
   changes each previous Unit and therefore requires `employee.assignments.update` for those Units.
   No empty-list bypass or new API is introduced. A rejected mutation remains atomic.
4. **Remove the validation key from all catalogs.** The message has no remaining valid state and
   retaining it would leave dead product copy. Existing generic Unit picker labels remain.

## Risks / Trade-offs

- **An Employee removed from the final Unit disappears from that View immediately.** → Browser
  coverage will assert that the global Employee remains available and can be assigned again.
- **A scoped user could attempt to clear assignments outside their authority.** → Existing server
  comparison checks every changed Unit against pre-mutation permissions and rejects the whole
  command.
- **Tests may only cover custom Views and miss the system View.** → Store and browser tests will
  cover both active-View isolation and global catalog persistence.

## Migration Plan

No State or database migration is required. Deploying the UI removes only the client-side minimum
selection restriction; rollback restores that restriction without altering stored data.

## Open Questions

None.
