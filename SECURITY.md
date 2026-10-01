# Security policy

## Reporting a vulnerability

Use GitHub private vulnerability reporting for `iwonz/org-tools`. Do not publish personal data,
organization exports, credentials, database material, backup files, screenshots of real
organizations, or exploit details in an issue. Include the affected version, a synthetic minimal
reproduction, impact, and known mitigation.

## Security boundary

Org Tools is a self-hosted multi-account application. PostgreSQL is private to the deployment and
all browser access passes through the same-origin server. Authentication uses Argon2id passwords,
hashed opaque sessions, bounded expiry and rate limiting. Mutations require CSRF, exact Origin,
Fetch Metadata, and JSON. Authorization combines permissions/scopes with resource ACL and filters
responses before serialization. UI hiding is never treated as enforcement.

Production deployments must use HTTPS through a reverse proxy, protect `.env` and external storage
paths, keep PostgreSQL off public networks, and retain tested encrypted backups. The application
does not provide MFA, SSO, SCIM, or email password reset in v1; use the local interactive Super
Administrator recovery command when necessary.

Security changes must preserve generic login and inaccessible-resource responses, strict bounded
parsers, prepared SQL, migration checksums, audit secret redaction, session revocation, filtered
Download/PNG output, local assets, and publication scans. See [Privacy](docs/privacy.md) and
[Architecture](docs/architecture.md).
