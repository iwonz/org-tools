## Context

The import session already normalizes recognized state projections and generic mapped JSON into a
`StructuredImportPlan`, but each Team preview currently retains only its key, name, mode, and
children. The UI therefore cannot display assignments, positions, bosses, or Employee cards, and
Employee-only state projections misleadingly render an empty Team placeholder. Append and Replace
are also presented as adjacent plain rows inside the content selector.

The application must remain browser-only, failure-atomic, bilingual, and responsive at 20,000
Employees and 4,000 Teams. `OrgToolsState` and the candidate builders remain the source of truth for
what is committed.

## Goals / Non-Goals

**Goals:**

- Make the operation choice a distinct, accessible, responsive section.
- Preview every imported Team in hierarchy order and every directly referenced Employee as a
  read-only card without duplicating Employee records in the plan.
- Distinguish manual assignments from Live boss/position roles and avoid claiming calculated Live
  membership before import.
- Keep large previews virtualized with stable rows and dynamic measurement.
- Use one preview surface for recognized partial state and generic mapped Team imports.

**Non-Goals:**

- Change state schemas, import matching, candidate construction, layout translation, or commit
  behavior.
- Preview Full workspace Views or calculate future Live membership against the resulting candidate.
- Add links, editing, persistence, network work, or a new runtime dependency to preview cards.

## Decisions

1. **Keep preview data normalized.** `StructuredImportPlan.employees` remains the sole Employee
   collection. Team plans gain manual assignment and Live role records containing only an
   `employeeKey`, position, and boss flag. Rendering indexes Employees by key. This avoids large
   object duplication when one Employee belongs to multiple Teams.

2. **Represent Live references separately.** Manual assignments render under an Employees group.
   A Live Team renders its boss and position overrides under a Live roles group. Filter-derived
   membership is not materialized because Append can depend on current workspace Employees and
   assignments.

3. **Flatten for virtualization, retain tree semantics.** A pure flattener produces section, Team,
   and Employee rows with stable composite keys and depth. Teams begin expanded; a local collapsed
   key set resets when the source, projection, or mapped plan changes. `@tanstack/react-virtual`
   dynamically measures wrapped tags and nested cards inside a bounded scroll viewport.

4. **Use a preview-specific Employee card.** It renders local avatar data, display name,
   username/email text, assignment role, all wrapping tags, and Append identity status. It exposes
   no profile or mail links and does not construct the richer runtime `Employee` model.

5. **Separate operation and content selection.** The existing radio inputs remain native and are
   wrapped by two responsive choice cards under a localized Import mode heading. Selected state is
   conveyed by radio state, border, background, and an icon; Replace also uses destructive copy and
   color. Full workspace stays replacement-only.

6. **Validate before preview and commit as today.** The planner continues to validate every key and
   relationship, while the store builds and parses a detached complete candidate before mutation.
   The richer plan is display-only and never becomes persisted state.

7. **Use general publication safeguards.** Documentation and checks describe portable repository
   hygiene such as paths, generated output, language, media, schemas, and secrets. They do not carry
   origin-specific policy or terminology.

## Risks / Trade-offs

- [A Team with many assignments creates many measured rows] → Flatten once per plan/collapse change,
  virtualize the bounded viewport, and keep Employee records shared by key.
- [A Live role card could be mistaken for membership] → Label the group Live roles and explicitly
  state that membership is evaluated after import.
- [Deep hierarchy can consume horizontal space] → Use compact depth guides, bounded indentation,
  full-name titles, and safe local horizontal overflow on narrow screens.
- [Replace counts can look like Append identity results] → Show New/Existing only for Append and a
  neutral imported total for Replace.
- [Richer cards can make the dialog tall] → Keep one dialog body scroll plus a bounded preview
  viewport and verify desktop and narrow layouts.

## Migration Plan

No data migration or rollout is required. The internal plan is rebuilt from the selected file on
every import session. The change can be rolled back without affecting saved state files.

## Open Questions

None.
