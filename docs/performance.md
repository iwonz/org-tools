# Performance

The maintained target is 20,000 Employees and 4,000 Units.

## Validation

All unit tests remain mandatory because their complete runtime is only a few seconds. Expensive
browser feedback may be selected locally by changed paths, while authoritative CI always runs the
complete 47-test catalog. CI partitions those tests across four isolated one-worker runtimes and
runs static/runtime, gallery, and production-image evidence concurrently. The gallery remains two
complete deterministic passes. Each repository runner prints command and total wall time so the
critical path and regressions can be compared without recording application data.

## Server

Organization mutations lock and parse one JSONB document once, update the Employee identity index
in the same transaction, and use optimistic revisions to avoid lost updates. Security mutations use
a separate revision. SSE sends revision markers instead of documents.

Authorized projections build normalized membership and hierarchy indexes once per cache entry. A
bounded LRU keys entries by organization revision, security revision, and account ID; security,
role, ACL, relationship, and organization changes invalidate affected results. Filtering remains
linear in visible Employees, Units, assignments, Tags, fields, slots, Views, and Canvas elements.
Alternate image-export projections reuse this cache, return one View, and use a separate bounded
browser cache keyed by account, View, optional root Unit, and both revisions. In-flight work is
cancelled when the selected account or either revision changes.

PostgreSQL indexes normalized account/Employee email, session digests and expiry, audit time/actor/
action, and server-event order. Login rate buckets are updated atomically. Migrations use one
advisory lock and never race application startup.

## Browser

Employee and Unit catalogs retain derived maps, virtualized rows, bounded search values, and
measured variable heights. The Editor keeps spatial indexes and renders only visible geometry.
Authorized projection hydration occurs once per revision; UI-only writes do not rebuild the
organization.

Employee card DOM and Canvas share measured rich-line layout, Tag/position chips, wrapping, line
gaps, bounds, hit testing, and anchors. Text measurement and parsed templates use bounded caches
that include font, locale, direction, width, density, and content.

## Output and Backup

Data Download streams one authorized traversal and performs optional line de-duplication with a
bounded set. Image preview and final output use the same filtered document and enforce pixel and
dimension limits.

Image Tag exclusions use one bounded ID set per render and are applied before rich-line, Slot, and
Unit-footer measurement. Hiding Staffing Slots filters rows and dependent attachment chains before
bounds are calculated. The Tag selector virtualizes its visible catalog, while Select all and
Deselect all remain one linear pass over the complete authorized catalog.

Backup streams bounded table sets into a validated payload, gzip compresses once, and derives its
encryption key with intentionally expensive Argon2id. Restore validates before taking the exclusive
maintenance lock; only the final replacement transaction blocks ordinary work.

Performance browser coverage loads 20,000 Employees, 4,000 Units, and bounded Canvas content,
checks spatial candidate counts and interaction frame samples, and runs through the authenticated
PostgreSQL runtime.

Static dead-source analysis and registry advisory checks run only during validation. Security
response headers are constant configuration, and the UUID consolidation removes duplicate fallback
logic without adding work to rendering, projection, persistence, or interaction paths.
