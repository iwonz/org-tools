# Usage

## Start and first account

Create `.env` and external storage with `./bin/org-tools env init`, then run
`./bin/org-tools up`. Open the exact `ORG_TOOLS_PUBLIC_ORIGIN`. On an empty installation, enter the
setup token from `.env`, an email, and a password of 15–128 Unicode code points. This one-time form
creates the first Super Administrator. Later visits show email/password sign in.

Sessions expire after eight idle hours or 24 absolute hours. A temporary password always opens a
mandatory password-change form before organization data becomes available. The account menu changes
the current password or signs out. For a Super Administrator it also opens Administration.

## Navigation and access

The sidebar contains only product destinations allowed to the current account: Employees, Units,
Editor, Calendar, and Data Download. Its footer keeps the account, theme, and language controls in
that order. Administration is available only from a Super Administrator's account menu. An
unavailable action is also rejected by the server if called directly.

The system roles are:

- **Super Administrator**: complete server-side bypass and Administration. The last active Super
  Administrator cannot be disabled or demoted.
- **Employee**: read access to permitted Employees, Units, Calendar, system Editor, and permitted
  custom Views.
- **Manager**: Employee access plus default write grants scoped to branches managed through boss
  assignments in the system View.

Being a Unit boss does not change an Employee account into Manager. A Manager with no managed Unit
has no scoped write target. Custom roles choose explicit permission/scope pairs. A Super
Administrator may add direct grants to one account; they extend the role and never deny it.

## Administration

### Users

Create an account by selecting a role and, for non-Super-Administrators, one Employee whose email
matches the account email. One Employee maps to at most one account. The generated temporary
password appears once. Edit a user to change role and direct grants, reset the password, revoke
sessions, or deactivate access. Accounts remain as reserved audit identities rather than being
physically deleted.

Changing a linked email requires the administrator's current password. The account and Employee
email change atomically and other sessions for that account are revoked.

### Roles

Roles group permissions and valid scopes. Administration presents localized task names for every
permission and scope while the server retains stable identifiers. System Super Administrator is
immutable. A custom role can be deleted only after accounts, direct references, and ACL references
are removed. The effective preview combines the selected role and direct grants.

### Access

Read and write audiences can include every authenticated account, explicit roles, explicit users,
or self/managed relationships. Policies cover built-in and custom Employee fields, Tags, Units,
staffing slots, and Views. Unit descendants inherit their parent boundary and may only narrow it.
Staffing slots inherit their Unit and may narrow further.

Custom fields and migrated custom Views are closed to ordinary roles until configured. Existing
built-in fields, Tags, Units, slots, and the system View begin visible to authenticated users. A Tag
can hide every Employee carrying it from accounts that cannot read that Tag. The account's own
Employee remains visible, with restricted values removed.

### Audit

Audit shows authentication, denied requests, organization mutations, access changes, Backup, and
Restore with time, result, actor, targets, and correlation ID. Search and bounded pages support
investigation without exposing secrets or hidden field values.

### Backup and Restore

Enter the current administrator password and a passphrase of 15–128 Unicode code points to create
an encrypted `.org-tools-backup`. It includes organization, account password hashes, roles, grants,
policies, per-account UI, and audit. It excludes sessions, CSRF, setup token, and rate-limit state.

Restore requires the same reauthentication and passphrase. Org Tools decrypts and validates the
whole candidate before mutation, verifies references and an active Super Administrator, creates an
encrypted timestamped recovery Backup, applies one transaction, and signs out every account.

## Employees and model

Employees keep stable UUIDs. Create, edit, delete, assignments, model changes, Tag assignment, and
Tag catalog operations each require their own permission and applicable scope/ACL. A linked
Employee cannot be deleted. The linked account email is Administration-only. An Employee may
remain in the global catalog without a Unit assignment. Clearing every assignment in an Employee
form removes membership only from that form's system or custom View and leaves other Views intact.

Custom Value fields support scalar and multi-value text, number, flag, date, and options. Composite
fields contain typed subfields with exactly one required unique primary key. Template fields derive
values with local formatting and hashes. Hidden source fields remain on the server; visible Template
results are computed there.

The Display tab configures four Employee card formats and line gaps. Formats support token
suggestions with `@`, inline Markdown, authored lines, semantic Tag chips, and assignment chips.
Changes apply immediately and each format has an independent Reset.

## Units and Editor

The Units section edits the canonical system hierarchy. Custom Editor Views contain isolated Unit
documents and geometry while Employees, fields, and Tags stay global. Manager scope is always based
on boss relationships in the system View, even while viewing a custom View.

The Editor supports Units, Employees, staffing slots, arrows, text, stickers, layout, selection,
clipboard, distribution mode, and PNG export. Staffing slots belong to one View-local Unit and do
not count as Employees. DOM and PNG share geometry, card formats, Tag layout, colors, bounds, and
anchors. Image export contains only visible resources and requires its explicit permission.

In either PNG dialog, a Super Administrator can choose **Export as** and select an active account.
Preview, Copy, and Save then use that account's role, direct grants, managed branches, and ACL while
the administrator remains signed in. **My access** is restored whenever the dialog opens. If the
account cannot read the current View or scoped Unit, image actions remain unavailable. The choice
does not affect JSON or Template Data Download.

**Tags in image** searches the selected access subject's visible Tag catalog. It supports selecting
or clearing the complete catalog independently of the current search and then toggling individual
Tags. The account stores exclusions, so newly created visible Tags appear automatically. **Hide
Staffing Slots** removes Slot rows, Tags, counters, dependent Canvas attachments, and affected
geometry. These two preferences are shared by full-View and scoped Unit image export and update the
preview immediately.

## Calendar and Data Download

Calendar contains only visible Employees, birthdays, dated Tags, and composite dates. Hidden fields,
Tags, Employees, and Units do not contribute events or counts.

Data Download supports authorized structured JSON and Template text. It can select visible fields,
Tags, and Unit values, remove empty lines, and retain unique lines. Every preview, counter, Copy,
and Save uses the same filtered projection. Complete application State and Employee Import are not
supported transfer formats.

## Operations

`./bin/org-tools logs` follows service logs and `./bin/org-tools down` stops containers without
deleting external data. Update `ORG_TOOLS_IMAGE` or pull the current tag, then run
`./bin/org-tools up`; migrations complete before the app starts. If migration readiness fails, the
app remains unavailable until the schema issue is resolved.

Use `./bin/org-tools reset-super-admin-password` from a trusted local TTY when the administrator
password is lost. It resets the selected Super Administrator, revokes sessions, requires password
change at next login, and appends an audit event.
