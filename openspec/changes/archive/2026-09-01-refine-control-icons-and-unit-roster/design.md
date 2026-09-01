## Context

Most text-bearing buttons and tabs already render their thematic icon first. The remaining explicit
exceptions are the shared contextual header action and the Editor Arrange and collapse/expand
commands. Canonical specs still describe the older trailing-icon order in several places, including
one MCP requirement that contradicts both the current MCP implementation and its dedicated leading
icon requirement.

The selected-Unit roster currently passes two sections into the shared Employee list: direct
Employees have no heading, while descendant Employees receive a translated heading and repeated
count. The complete total and filtered count already appear below search, and no other caller uses
the sectional Employee-list API.

## Goals / Non-Goals

**Goals:**

- Establish one testable leading-icon convention for thematic icons in text buttons and tabs.
- Preserve trailing affordances whose position communicates disclosure, sorting, removal, status,
  or count.
- Render selected-Unit Employees as one contiguous virtualized roster with one summary count.
- Remove the unused section-row implementation and translation after flattening the roster.
- Refresh and publish the deterministic browser-only gallery and Pages application after the normal
  validation and merge lifecycle.

**Non-Goals:**

- Add icons to text-only controls or change icon-only controls.
- Change button, tab, hover, focus, active, disabled, responsive, or accessibility behavior.
- Change Employee membership, ordering, drag permissions, filtering, state, persistence, API, MCP,
  or privacy contracts.

## Decisions

### Use semantic JSX order rather than CSS reordering

Each affected thematic icon will precede its visible label in DOM and flex order. This keeps visual,
keyboard, accessibility-tree, and source order aligned. A global CSS rule was rejected because it
cannot distinguish thematic icons from conventional trailing chevrons, sort arrows, removal marks,
badges, or counts.

### Preserve explicit trailing affordances

Disclosure chevrons, active sort direction, chip removal marks, status badges, and counts remain
after the label. These elements communicate a trailing operation or state rather than the subject
of the action. Decorative thematic icons remain hidden from assistive technology where necessary,
and existing accessible names remain authoritative.

### Flatten the selected-Unit roster before virtualization

The Unit surface will memoize one visible Employee array by concatenating filtered direct Employees
and filtered descendant Employees in their current order. `EmployeeCardList` will receive that array
through its ordinary `employees` input, so virtualization, stable Employee IDs, measurement, actions,
and drag predicates continue unchanged. The unused section type, count formatter, header estimate,
and section-row branch will be removed from the shared list instead of retained as dead flexibility.

### Publish only after repository delivery is complete

All 43 gallery scenarios will be regenerated and inspected twice before commit. After specs are
synced and archived, the change will be fast-forwarded to `main` and pushed. The guarded Pages
publisher will then dispatch `pages.yml` only from a clean `main` that matches `origin/main`; the
workflow and public browser-only scenario will be verified before completion.

## Risks / Trade-offs

- **A broad icon audit could accidentally move a trailing affordance.** Mitigation: classify each
  control by semantic role and add browser assertions for both leading thematic icons and preserved
  trailing indicators.
- **Flattening could change Employee ordering or drag behavior.** Mitigation: concatenate the two
  already-filtered arrays in their existing order and keep the direct-membership drag predicate.
- **Generated images can include unrelated nondeterminism.** Mitigation: use the maintained fixed
  fixture and clock, inspect every PNG, and require identical hashes from two complete generations.
- **Pages deployment can succeed while the public cache is stale.** Mitigation: wait for the workflow
  result and exercise load, Import, edit, and Export at the public URL without MCP or external data
  requests.
