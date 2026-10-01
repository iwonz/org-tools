## Context

Editor PNG preview, copy, and save are client-side render operations over the current session's
authorized MobX projection. Super Administrators therefore render unrestricted data even when the
intended audience has a narrower role, direct grants, Manager relation, or resource ACL. Exact
access cannot be represented by a role alone, and temporarily replacing the application projection
would risk leaking data into unrelated UI and persistence.

The server already builds bounded account-specific projections keyed by organization revision,
security revision, and account. The image renderer already accepts explicit Employees, Units,
Tags, fields, View settings, and Canvas elements. The change joins those boundaries through a
minimal, audited export-only API and one selected export-source object.

## Goals / Non-Goals

**Goals:**

- Let a Super Administrator render either PNG surface exactly as one active account can see it.
- Keep Preview, Copy, and Save on the same revisioned, account-authorized source.
- Keep hidden data out of the alternate-subject response and renderer inputs.
- Preserve the acting administrator's session and transient image settings.
- Keep the flow bounded and responsive for the documented organization scale.

**Non-Goals:**

- General account impersonation or changes to the current session.
- Role-only access simulation or disabled-account selection.
- Custom-role or direct-grant assignment of the export-as permission.
- Alternate-subject JSON, Template, Data Download, or per-account UI settings.

## Decisions

### Reserve a permission instead of overloading image export

`editorImageExport.exportAs` is a global permission in the public registry but is excluded from
assignable grants. Super Administrator's existing bypass satisfies it; TypeScript validation,
Administration controls, and PostgreSQL checks reject stored role or account grants. This keeps the
sensitive capability independently auditable without creating a reusable data-exfiltration grant.

### Use a minimal export-subject API

A guarded GET route returns active subject summaries only. A CSRF-protected POST accepts an exact
account, View, and optional root Unit, loads the current organization snapshot plus the target
account and role, and delegates filtering to `AuthorizedProjectionService`. The response contains
revisions, the subject summary, authorized display configuration, fields, Employees, Tags, and at
most the requested View. It never includes target UI state, grants, policies, sessions, or Admin
records. Unknown and inactive account IDs use the standard unavailable response.

The POST requires the actor's image-export and export-as permissions. The target's own export
permission is irrelevant because the actor performs the export; the target supplies only the read
projection. Successful alternate projection creation appends an audit event identifying actor,
subject, View, and optional root Unit without data values.

### Select one immutable source for every render action

Both dialogs use a shared controller whose selected value starts at `self` whenever the dialog
opens. Self uses the existing authorized source without a request. Another account loads a bounded
alternate source keyed by subject, View, organization revision, and security revision. Selection
changes and revision changes abort stale work. Loading, unavailable, and failed sources disable
Preview, Copy, and Save.

An `OrgEditorImageExportSource` adapter hydrates authorized Employees and derives Live memberships,
Unit summaries, Canvas input, distribution maps, and token definitions from one projection. The
renderer never mixes alternate source collections with full Super Administrator store collections.
The Unit dialog resolves its root by stable ID inside that source and reports unavailable if absent.
Current distribution UI is intersected with visible source Units; all other image settings remain
the actor's transient values.

### Make authorized Template values context-local

Resolved Template values currently use a process-global client map installed with the session
projection. Export rendering gains an explicit resolved-value map threaded through custom-field and
Employee-display evaluation. The current UI may retain its installed default, while alternate PNG
rendering passes its own map and cannot overwrite or consume another session context.

### Keep schema rollout forward-only

Migration `0003` extends the PostgreSQL permission domain, updates grant validation, and prevents
the reserved permission in role and account grant tables. It changes no organization document or
business row. The migrate service applies it before the application starts; pending or changed
checksums continue to fail readiness.

## Risks / Trade-offs

- [A renderer accidentally reads the Super Administrator store] → Pass a single export-source
  object through both dialogs and cover hidden fields, Tags, Employees, Units, Slots, Canvas
  attachments, summaries, and Template values in API and PNG-plan tests.
- [Access changes while a preview is open] → Key and invalidate alternate sources by both revisions,
  abort stale requests, and disable actions until the replacement preview is ready.
- [Large account lists or projections slow the dialog] → Fetch subjects only for a Super
  Administrator opening image export, use searchable bounded rendering, reuse the server projection
  LRU, and return only one requested View.
- [The selected account loses access or is disabled] → Convert the response to the same unavailable
  state used for a missing View or root Unit and never fall back to the actor's data.
- [Reserved permission appears grantable] → Maintain an exhaustive assignable-permission subset and
  enforce the same restriction in UI, service validation, backup validation, SQL checks, and tests.

## Migration Plan

1. Build and test migration `0003` against empty and current PostgreSQL schemas.
2. Run the migrate service under the existing advisory lock, then restart the application and prove
   schema readiness.
3. Deploy server and UI from the same image so the permission registry and API contract change
   together.
4. Rollback uses the pre-deployment PostgreSQL backup and previous image; the migration is not
   edited or reversed in place.

## Open Questions

None.
