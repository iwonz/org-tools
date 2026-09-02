## Context

Org Tools has one canonical `kind: "main"` View and optional independent custom Views. The toolbar
already guards rename and delete operations by View kind, but it nests all management actions under
the non-empty-canvas condition. As a result, an empty active custom View exposes the selector but no
way to rename or delete that View. The internal kind and strict public state remain correct; only the
localized presentation of the canonical View needs to change.

## Goals / Non-Goals

**Goals:**

- Present the canonical View with the product's localized Units destination term in both locales.
- Expose accessible Rename and Delete controls for every active custom View, including empty ones.
- Keep deletion explicit, atomic from the user's perspective, and safe for active View and Download
  source references.
- Persist and synchronize the mutation through the existing single-state change tracking.

**Non-Goals:**

- Renaming the internal `main` kind, TypeScript types, MCP fields, or public state structure.
- Deleting or renaming the canonical View.
- Adding trash, restore, cross-deletion undo, migrations, or dependencies.
- Changing Pages privacy or server persistence architecture.

## Decisions

1. **Localize the existing canonical label instead of changing data.** The `Main` message remains
   the stable source key, while its values become the existing localized Units destination labels.
   Related user-visible phrases use the same product term. This keeps serialized View names, kind
   discrimination, MCP semantics, and imports unchanged.

2. **Separate canvas-dependent history actions from View management.** Undo and Redo remain hidden
   for an empty canvas. Create, Rename, and Delete render whenever the View toolbar is present;
   Rename and Delete remain conditional on `kind: "custom"`. This reuses the existing toolbar,
   confirmation dialog, and store operation rather than adding a second empty-state action.

3. **Repair all durable references during deletion.** `OrgViewsStore.deleteView` removes only a
   known custom View and selects the canonical View when necessary. `OrgStore.deleteOrgView` also
   replaces a deleted Download source with the canonical View and resets the Download session so
   the next strict snapshot cannot contain a dangling View ID. Per-View selection and viewport data
   disappear naturally because durable UI is derived only from remaining Views.

4. **Keep cancellation side-effect free.** Opening the destructive dialog does not mutate state.
   Cancel preserves the View, active selection, Download source, and editor document. Confirm uses
   the active custom View captured by the toolbar and closes through the shared AlertDialog flow.

5. **Exercise both populated and empty custom Views.** Unit coverage checks state cleanup and main
   protection. Browser coverage checks localized naming, visible management controls on an empty
   custom View, cancellation, confirmation, fallback selection, automatic server persistence, and
   Pages behavior.

## Risks / Trade-offs

- **Risk: “Units” can resemble the product destination rather than a View name.** → This is the
  requested simplification and is reinforced consistently in the selector and related actions.
- **Risk: deleting a View selected as the Download source could create invalid strict state.** →
  Replace the source with the canonical View and reset transient Download selections in the same
  store action.
- **Risk: destructive controls can be missed on compact toolbars.** → Keep the existing icon-only
  geometry but add explicit localized accessible names, titles, stable test hooks, and confirmation.
- **Risk: empty-canvas management adds toolbar controls that were previously hidden.** → Render only
  when a custom View already exists; the initial empty canonical canvas remains uncluttered.
