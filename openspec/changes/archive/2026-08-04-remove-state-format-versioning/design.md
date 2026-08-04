## Context

The application currently exposes two complete-state type names and two structured-import type names, branches parsers on numeric versions, and carries migrations for string tags. The user has chosen a current-schema-only policy: saved files are explicit local snapshots, not a long-lived interchange protocol, and future model changes should replace obsolete readers instead of accumulating compatibility branches.

## Goals / Non-Goals

**Goals:**

- Expose one unversioned complete-state type and one unversioned additive-import type during this prerequisite change.
- Keep strict exact-field validation, graph validation, local processing, and candidate-state atomicity.
- Delete old migrations, version-specific messages, fixtures, and tests.
- Establish an enforceable documentation and test convention for future interface changes.

**Non-Goals:**

- Unifying complete and partial files; the following change performs that redesign.
- Changing save choices, import layout, filenames, data semantics, UUIDs, or organization state.
- Adding fallback parsing, automatic repair, server storage, or network behavior.

## Decisions

### Rename current contracts rather than aliasing them

`OrgToolsState` and `OrgToolsImport` become the only exported type names. Aliases for numbered names are deliberately not retained because aliases would preserve the compatibility surface the change removes.

### Reject obsolete files at the exact-field boundary

Both parsers accept only their current discriminator and exact unversioned shape. A former `formatVersion` field is therefore unknown and rejects the file before normalization or candidate construction. A JSON object claiming `org-tools-state` is never reinterpreted as tabular input after strict state validation fails.

### Keep runtime semantics unchanged

Removing version dispatch occurs before the existing normalization, identity, reference, Live-cycle, and detached-candidate validation. Writers remove the numeric field and otherwise emit the same data, so performance and privacy boundaries do not change.

### Encode the policy in repository guidance and tests

OpenSpec context, architecture/import documentation, public examples, and contract tests state that public schemas are current-only. Targeted tests assert that current output contains no version field and that old versioned inputs fail, preventing a future migration layer from being reintroduced accidentally.

## Risks / Trade-offs

- **Previously saved files stop opening** → Document the breaking behavior plainly and return an owned validation error without mutation.
- **A future change can silently drift examples** → Validate every bundled example and generated fixture with the production parser.
- **Broad type renaming can leave stale references** → Search source, tests, docs, fixtures, and generated-data scripts for numbered symbols and version fields before validation.
- **Temporary additive contract is removed by the next change** → Keep this prerequisite focused and archive it before beginning state unification.
