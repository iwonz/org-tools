## ADDED Requirements

### Requirement: Employee transfer enforces complete birthday values
Complete-state Import and mapped Employee Import SHALL accept a non-null birthday only as a valid
canonical `DD.MM.YYYY` value. Year `1900` SHALL retain unknown-year semantics. Obsolete `MM-DD`, ISO,
timestamp, partial, and locale-inferred values MUST be rejected without fallback or mutation.

#### Scenario: Import a known year
- **WHEN** mapped Employee input contains a valid `DD.MM.YYYY` birthday with a year after 1900
- **THEN** the preview and atomic Apply retain the complete canonical value

#### Scenario: Import an unknown year
- **WHEN** mapped Employee input contains a valid birthday whose year is `1900`
- **THEN** Apply retains its day and month while the application treats its year as unknown

#### Scenario: Reject obsolete or invalid birthday input
- **WHEN** any selected Employee row or complete state contains a birthday outside the current contract
- **THEN** Import shows localized format feedback and current memory, SQLite, and live tabs remain unchanged
