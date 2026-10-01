## Context

The shell currently derives the active destination only from items rendered in the sidebar. That
couples visibility to reachability, so simply removing Administration from the list would make its
`TabsContent` unreachable. The account menu owns password and logout actions but does not navigate.
Administration renders raw `Permission` and `PermissionScope` values in selects and role summaries.

## Goals / Non-Goals

**Goals:**

- Keep Administration reachable only to Super Administrators through the account menu.
- Preserve authorized-tab fallback when access changes or stale UI state names Administration.
- Use consistent start alignment, icons, modal padding, and authentication heading alignment.
- Localize every permission and scope shown to a person through exhaustive typed registries.

**Non-Goals:**

- Change permissions, scopes, role behavior, audit action identifiers, APIs, State, or PostgreSQL.
- Redesign Administration content or the forced-password workflow.
- Change authorization enforcement or expose Administration to ordinary accounts.

## Decisions

### Separate visible navigation from reachable destinations

Keep ordinary sidebar items in one filtered list and add Administration to a separate authorized
destination list only for a Super Administrator. Active-tab validation and header metadata use the
authorized list; the sidebar renders only ordinary items. `AccountMenu` receives an optional
navigation callback so it stays independent from the store. This preserves server-driven access and
avoids duplicating Administration content or inventing a route.

### Treat alignment as logical start

Administration tabs use `self-start`/`justify-start`, so LTR starts at the left and Arabic RTL starts
at the right. Horizontal overflow remains available. Each trigger embeds one decorative Heroicon;
the localized tab text remains its accessible name.

### Reuse dialog spacing primitives

The password form uses the shared `DialogBody` between `DialogHeader` and `DialogFooter` rather than
adding one-off padding. Login and Setup wrap only their icon/title/description in a centered heading
group; form controls and errors retain logical-start alignment. Forced password change is unchanged.

### Keep security identifiers internal

Add `satisfies Record<Permission, UiTextKey>` and `satisfies Record<PermissionScope, UiTextKey>` UI
registries. Select values and commands continue to carry exact identifiers, while option text and
read-only role badges resolve through the registries. Compile-time exhaustiveness and unit tests make
new permissions fail until they receive a localized label.

## Risks / Trade-offs

- [Administration has no sidebar trigger] → Validate the active value against all authorized
  destinations and cover direct account-menu navigation and demotion fallback in browser tests.
- [Long localized tab labels overflow] → Preserve the bounded horizontal scroller and logical-start
  alignment in LTR and RTL.
- [Translation drift reveals raw identifiers] → Keep one typed mapping, require all six catalogs,
  and assert that representative Administration surfaces contain no registry identifiers.

## Migration Plan

No State, database, or API migration is required. Deployment replaces UI code and bundled locale
catalogs. Rollback restores the previous shell and labels without transforming persisted data.

## Open Questions

None.
