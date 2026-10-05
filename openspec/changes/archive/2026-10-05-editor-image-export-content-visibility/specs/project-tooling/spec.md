## ADDED Requirements

### Requirement: PNG content visibility has migration and deterministic visual evidence
Repository validation SHALL cover exact UI parsing, PostgreSQL migration of existing account and
bootstrap UI JSON, account projection, semantic Tag filtering, complete Staffing Slot suppression,
attachment reachability, both PNG dialogs, access-subject changes, six locales, RTL, and the 20,000
Employee / 4,000 Unit target. The maintained gallery SHALL remain exactly 56 PNG files and SHALL be
deterministic across two complete generations.

#### Scenario: Validate the current UI shape
- **WHEN** migration `0004` runs against the immediately preceding schema
- **THEN** every account and bootstrap UI row receives empty Tag exclusions and visible Staffing Slots
- **AND** the production parser accepts the result after first and repeated startup

#### Scenario: Validate image output twice
- **WHEN** the maintained gallery is generated twice after the change
- **THEN** all 56 PNG files have identical SHA-256 hashes and the image-export frame shows the new controls

### Requirement: Unpatched development advisories remain bounded and reviewable
Validation SHALL allow a temporary dependency advisory exception only when its advisory ID,
package, complete dependency path, dev-only classification, missing patched version, and review
date all match a tested repository rule. Every other moderate-or-higher advisory SHALL continue to
fail validation.

#### Scenario: Audit the current OpenSpec dependency
- **WHEN** the package audit reports `GHSA-vfj7-8cjw-p6xm` only through the exact OpenSpec development path before 2026-11-05 and no patched release exists
- **THEN** validation records the temporary exception and continues

#### Scenario: Reject drift or an expired exception
- **WHEN** the advisory reaches production, changes dependency path, gains a patched version, or reaches its review date
- **THEN** validation fails and requires an explicit dependency upgrade or security review
