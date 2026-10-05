## Context

Both Editor PNG dialogs already feed one Canvas renderer from either the current authorized
projection or a Super Administrator-selected account projection. Image settings are local React
state, while durable account UI settings are parsed exactly, projected against current access, and
written to PostgreSQL through `/api/ui`. The renderer currently builds rows, summaries, Tag clouds,
attachments, geometry, Preview, Copy, and Save from the complete authorized image source.

## Goals / Non-Goals

**Goals:**

- Let an account persist image-only Tag exclusions and complete Staffing Slot suppression.
- Apply one effective content policy to Preview, Copy, and Save in both dialogs.
- Preserve the selected export subject as the upper authorization boundary and reveal only its Tag
  catalog in the selector.
- Recompute scene geometry and attachment reachability after content suppression without changing
  organization data, Editor layout, grouping, or permissions.

**Non-Goals:**

- Do not parse arbitrary Canvas text or resolved custom Template strings for Tag names.
- Do not change Data Download, live Editor DOM, View membership, Live filters, sort order, or Tag
  assignment data.
- Do not add an export endpoint, permission, dependency, organization field, or compatibility parser
  for the obsolete UI shape.

## Decisions

### Persist exclusions in exact per-account UI State

Add `editorImageExport: { excludedTagIds, hideStaffingSlots }` to `OrgToolsUiState`. Exclusions are
stored instead of inclusions so every newly authorized Tag is visible by default. A store setter
normalizes unique IDs in catalog order, skips no-op writes, and triggers the existing debounced UI
write and server-event synchronization. Both dialogs read the same store preferences; their other
image settings remain transient.

Alternative: store this in organization settings. Rejected because the choice is personal and
must not affect other accounts. Browser storage is prohibited and would not synchronize.

### Treat the selected subject projection as the selector catalog

The control receives `source.tagDefinitions`, never the actor's unfiltered organization catalog.
Effective exclusions are intersected with that list for rendering, while bulk actions modify all
currently available source Tags regardless of search text. `projectAccountUi` removes missing or
unreadable IDs before serialization, so inaccessible Tag identity is absent from API payloads.

Alternative: request a second Tag list. Rejected because the existing authorized export projection
already supplies the exact catalog and revisions used by the image.

### Filter semantic surfaces at render planning time

The Canvas exporter derives an excluded-ID set once. It supplies Employees with filtered Tags to
the rich formatter (covering `{tags}` and `{tagDates}`), filters Slot assignments before Tag layout,
and filters Unit Tag summaries before footer geometry. Row ordering and grouping continue to use
the original authorized data, so this presentation option cannot change membership or layout
semantics beyond the space occupied by hidden visual content.

### Remove Staffing Slots before geometry and attachment resolution

When suppression is enabled, row plans omit Slot rows and summary plans zero both direct and total
Slot counts. Full-View and scoped scene selection exclude elements whose anchor dependency reaches
a hidden Slot; arrows requiring a hidden endpoint are excluded. Unrelated free-standing and
Employee/Unit-attached elements remain. Unit heights, hierarchy connections, row offsets, bounds,
anchors, and final image bounds then consume the filtered plan.

Alternative: paint transparent Slot rows after layout. Rejected because labels, counts, attachment
positions, and whitespace would still disclose their existence.

### Migrate JSONB UI documents once

Migration `0004` adds safe defaults to non-null `organization_documents.bootstrap_ui_json` and all
`account_ui_states.ui_json` rows. Application parsing remains current-only. Migration execution is
transactional under the existing advisory lock; a failed statement leaves the previous schema and
rows intact. Rollback uses the external PostgreSQL backup taken by the normal release procedure.

## Risks / Trade-offs

- [A hidden Tag can still affect existing group order] → This is intentional: output filtering is
  presentation-only and does not silently alter Editor grouping semantics.
- [A custom Template value can contain a Tag label as ordinary text] → Do not inspect arbitrary
  strings; document that only built-in semantic Tag fields are filtered.
- [Large Tag catalogs can make the selector expensive] → Normalize with sets, preserve catalog
  order, and virtualize the searchable option list.
- [Removing Slot-attached elements changes scene bounds] → Build reachability and bounds from the
  same filtered scene used for painting, then test full-View and scoped exports.
- [Old encrypted backups have the preceding schema count] → Existing exact-schema Restore behavior
  continues to reject mismatched backups; release notes identify the migration boundary.

## Migration Plan

1. Apply migration `0004` through the Compose migrate service before the new web image starts.
2. Verify every persisted and bootstrap UI document parses with production `parseOrgToolsUiState`.
3. Start the web service, update preferences, reload, and confirm a second migration/restart is a
   no-op.
4. On deployment failure, stop the web service and restore the pre-migration PostgreSQL backup.

## Open Questions

None.
