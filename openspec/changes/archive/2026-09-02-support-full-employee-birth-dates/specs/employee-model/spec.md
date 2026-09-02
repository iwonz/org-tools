## ADDED Requirements

### Requirement: Employee birthdays use complete canonical dates
Every non-null Employee `birthday` SHALL be a zero-padded `DD.MM.YYYY` string containing a valid
Gregorian day, month, and year. Year `1900` SHALL be reserved to mean that only day and month are
known and MUST NOT be treated as a literal birth year. Known years SHALL be between 1901 and the
current year. The unknown-year sentinel SHALL validate day and month against a leap-capable
calendar so `29.02.1900` remains representable.

#### Scenario: Known complete birthday
- **WHEN** an Employee is saved with a valid selected day, month, and known year
- **THEN** the birthday persists as canonical `DD.MM.YYYY` and the year remains known

#### Scenario: Unknown birth year
- **WHEN** day and month are known but year is not
- **THEN** the birthday persists with year `1900` and consumers treat it as recurring day-and-month data

#### Scenario: Unknown-year leap day
- **WHEN** an Employee birthday is `29.02.1900`
- **THEN** strict validation accepts it while still treating the year as unknown

#### Scenario: Invalid birthday
- **WHEN** a birthday uses another shape, is incomplete, is impossible for its known year, or is in the future
- **THEN** the complete operation is rejected without changing Employee or organization state
