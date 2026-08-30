# Security policy

## Reporting a vulnerability

Please use GitHub private vulnerability reporting for the `iwonz/org-tools` repository. Do not put
personal information, organization state files, screenshots of real organizations, or exploit
details in a public issue.

Include the affected revision, a minimal synthetic reproduction, expected impact, and any known
mitigation. Maintainers will acknowledge a complete report as soon as practical and coordinate a
fix and disclosure timeline with the reporter.

## Security boundary

org-tools is a local Next.js application with SQLite persistence. Its runtime binds only to
`127.0.0.1`, exposes only a same-origin project API, and has no authentication, telemetry, remote
synchronization, or remote organization-data API. The principal risks are unsafe local file
parsing, cross-origin local mutations, executable or oversized embedded values, accidental external
requests, formula-like spreadsheet output, and publication of a local database or non-synthetic
fixtures.

Security fixes must preserve strict state validation, bounded file and avatar handling, explicit
external navigation, prepared SQL, loopback Host and Origin checks, output escaping, and
same-origin-only background traffic. See
[Privacy](docs/privacy.md) for the maintained data-flow boundary.
