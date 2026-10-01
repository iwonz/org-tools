# Performance

The maintained target is 20,000 Employees and 4,000 Units.

## Server

Organization mutations lock and parse one JSONB document once, update the Employee identity index
in the same transaction, and use optimistic revisions to avoid lost updates. Security mutations use
a separate revision. SSE sends revision markers instead of documents.

Authorized projections build normalized membership and hierarchy indexes once per cache entry. A
bounded LRU keys entries by organization revision, security revision, and account ID; security,
role, ACL, relationship, and organization changes invalidate affected results. Filtering remains
linear in visible Employees, Units, assignments, Tags, fields, slots, Views, and Canvas elements.

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

Backup streams bounded table sets into a validated payload, gzip compresses once, and derives its
encryption key with intentionally expensive Argon2id. Restore validates before taking the exclusive
maintenance lock; only the final replacement transaction blocks ordinary work.

Performance browser coverage loads 20,000 Employees, 4,000 Units, and bounded Canvas content,
checks spatial candidate counts and interaction frame samples, and runs through the authenticated
PostgreSQL runtime.
