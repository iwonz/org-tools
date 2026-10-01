## Why

Super Administrators currently render Editor PNGs only from their unrestricted projection, so they
cannot safely prepare an image that matches what a less privileged account can see. A deliberate,
audited access-subject selector is needed to prevent hidden fields, Tags, Employees, Units, or
staffing slots from leaking through administrator-created exports.

## What Changes

- Add a Super-Administrator-only permission for exporting Editor images with another active
  account's effective access model.
- Add a searchable **Export as** selector to both full-View and scoped Unit PNG dialogs, defaulting
  to the current account on every open.
- Add minimal same-origin endpoints for active export subjects and a View-scoped authorized export
  projection, with CSRF protection, uniform unavailable-resource responses, and audit events.
- Build Preview, Copy, and Save from one isolated export source without replacing the current
  session, MobX store, or per-account UI state.
- Preserve the administrator's local image settings while removing every resource and value hidden
  from the selected account; block export when the selected account cannot access the View or Unit.
- Add a forward-only PostgreSQL migration for the new reserved permission. Organization State and
  business data remain unchanged.
- Update all six bundled locales, security and export documentation, and the maintained 56-image
  gallery.

Non-goals include general session impersonation, role-only previews, granting this capability to
custom roles, changing Data Download behavior, or persisting the selected export subject.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `authorization-and-access-control`: Reserve and enforce the export-as permission and construct an
  exact projection for the selected active account.
- `data-export`: Let both Editor PNG exports use a selected account's authorized projection for
  Preview, Copy, and Save.
- `privacy-safety`: Keep hidden organization data absent from alternate-subject API payloads and PNG
  input while retaining same-origin and audit protections.
- `interface-localization`: Localize the permission, selector, loading, and unavailable states in all
  six catalogs.
- `organization-editor`: Use one coherent selected export source for View and Unit geometry,
  Employees, Tags, staffing slots, Canvas elements, and summaries.

## Impact

The change affects the permission registry and Administration grant validation, PostgreSQL schema,
authorized projection API, audit records, both Editor PNG dialogs, export-source derivation,
Template value resolution, browser and unit tests, OpenSpec, documentation, locales, and the
existing Editor image-export screenshot. It adds no third-party service or network dependency and
does not change the organization document or per-account UI State shapes.
