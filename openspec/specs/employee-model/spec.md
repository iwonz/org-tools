# employee-model Specification

## Purpose
Define persisted Employee fields, Unit-scoped roles, and safe profile and avatar values.

## Requirements

### Requirement: Employees use generic persisted fields
The system SHALL persist a stable UUID, Employee identity, contact, profile, embedded avatar,
birthday, normalized gender, Tag assignments by catalog UUID, and typed custom values without
source-specific origins or remote photo fields. Gender SHALL be exactly `male`, `female`, or
`unspecified` and SHALL NOT be inferred from another value.

#### Scenario: Employee persistence
- **WHEN** an Employee is created, edited, saved, and reopened
- **THEN** its UUID, standard fields, Tag assignments, and custom values retain their values

#### Scenario: Invalid Employee identifier
- **WHEN** a strict Employee record contains a missing or non-canonical UUID
- **THEN** strict validation rejects the complete operation without changing organization state

#### Scenario: Invalid gender
- **WHEN** a strict Employee record contains a missing or unknown gender value
- **THEN** validation rejects the complete operation without changing organization state

### Requirement: Employee identity uses a stable UUID and a separate duplicate key
Every newly created Employee SHALL receive UUID v4. Imported new Employees SHALL retain a canonical
UUID. Duplicate detection SHALL use normalized first name, last name, and email with Unicode NFKC,
trimmed and collapsed whitespace, and locale-independent case-folding. Editing identity fields MUST
NOT change the UUID or relationship references.

#### Scenario: Edit Employee identity
- **WHEN** an identity edit has no normalized duplicate
- **THEN** the existing UUID and every Unit and UI reference remain unchanged

#### Scenario: Reject duplicate identity
- **WHEN** a create or edit matches another normalized identity tuple
- **THEN** the mutation is rejected atomically even though the UUID differs

### Requirement: Employee filters use complete ordered criteria
Every shared Employee filter, including Live Unit rules, SHALL render Unit, Tag, position, gender,
complete birthday, then custom fields. Birthday SHALL include day, month, and year and SHALL match
the exact canonical value, including `1900` for unknown year.

#### Scenario: Filter an exact birthday
- **WHEN** day, month, and year are selected
- **THEN** only Employees with that complete canonical birthday match

#### Scenario: Persist a Live Unit custom filter
- **WHEN** a Live Unit rule contains gender, complete birthday, or custom field selections
- **THEN** the strict state retains those selections and derived membership uses them

### Requirement: Roles remain Unit-scoped
The system SHALL store position and boss status on Employee-to-Unit assignments rather than on the Employee card.

#### Scenario: Multiple positions
- **WHEN** one Employee is assigned to multiple Units
- **THEN** each assignment can retain an independent position and boss status

### Requirement: Profile and avatar values are safe
The system SHALL allow only HTTP(S) profile links and bounded PNG, JPEG, or WebP data URLs for avatars.

#### Scenario: Unsafe values
- **WHEN** imported or opened data contains an executable profile scheme or unsupported avatar data URL
- **THEN** validation rejects the affected operation without rendering or requesting the value

### Requirement: Employee avatars can be selected and cropped locally
The application SHALL accept an explicit local PNG, JPEG, or WebP file or image clipboard item,
present a 1:1 pan and zoom crop interface, and store only a validated 512 by 512 WebP or PNG data URL
in the Employee draft. WebP SHALL remain preferred, while a browser-selected or explicitly retried
PNG SHALL be accepted when local WebP canvas encoding is unavailable. Source decoding, preview
downscaling, crop encoding, and fallback encoding MUST remain local and bounded.

#### Scenario: Select and crop avatar with WebP support
- **WHEN** a supported image within the source byte and pixel limits is selected or pasted, the crop
  is confirmed, and the browser encodes WebP
- **THEN** the form preview uses the locally encoded 512 by 512 bounded WebP without a network request

#### Scenario: Crop avatar without WebP support
- **WHEN** WebP canvas encoding returns no blob or a safe PNG fallback for an otherwise valid crop
- **THEN** the application accepts or explicitly encodes a 512 by 512 bounded PNG without changing
  the crop or requiring another user action
- **AND** the form preview and subsequent Employee save succeed without a WebP-specific error

#### Scenario: Downscale a large source without WebP support
- **WHEN** a valid source exceeds the preview-dimension cap and WebP canvas encoding is unavailable
- **THEN** the bounded preview is prepared as a local PNG and remains available for crop selection

#### Scenario: Invalid avatar source or output
- **WHEN** the source type, byte size, decoded dimensions, clipboard permission, image decode, all
  local encoders, or final encoded size is invalid
- **THEN** the draft remains unchanged and an owned format-neutral localized error is shown

### Requirement: Existing avatars can be adjusted or removed
The application SHALL allow an existing saved avatar to be re-cropped from its current square,
replaced from file or clipboard, or cleared without persisting the original source image.

#### Scenario: Cancel avatar edit
- **WHEN** the crop dialog is canceled or the Employee form closes without saving
- **THEN** the persisted Employee avatar remains unchanged and temporary image resources are released

#### Scenario: Remove avatar
- **WHEN** the user clears an avatar and saves the Employee form
- **THEN** `avatarBase64Url` becomes null and the initials fallback is displayed

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

### Requirement: Employee forms compose draft controls consistently
Employee create and edit forms SHALL represent Gender as a three-option native-radio segmented
control for Male, Female, and Not specified with one boundary, neutral internal dividers, keyboard
navigation, and tonal selection that does not change geometry. Birthday SHALL retain three
independent Day, Month, and Year Select values inside one compound boundary with internal dividers,
one focus treatment, and only outer corner radii. Changing month or year SHALL clear a now-impossible
day while preserving current `DD.MM.YYYY` and unknown-year `1900` semantics.

Tags SHALL use one shared picker whose closed trigger wraps every selected Tag chip without a `+N`
summary or separate selected list. A dated chip SHALL show its localized date after a middle dot.
The virtualized popover SHALL support search, create, checkbox selection, and an optional date per
row, while changing only the form draft until the form's Save succeeds. Unit assignments SHALL use
the single visible label `Units`, accessible name `Select Units`, and validation `Select at least one
Unit` in every Employee form mode.

#### Scenario: Choose gender with radio semantics
- **WHEN** a keyboard or pointer user chooses a Gender segment
- **THEN** exactly one native radio is selected and only its tonal fill changes within the stable shared boundary

#### Scenario: Enter a compound birthday
- **WHEN** a user chooses Day, Month, and Year
- **THEN** the three adjacent Selects expose one compound control and produce one valid canonical birthday or null

#### Scenario: Invalidate a selected birthday day
- **WHEN** a selected day does not exist after month or year changes
- **THEN** Day is cleared and no invalid birthday enters the draft

#### Scenario: Edit draft Tags
- **WHEN** a user searches, creates, selects, dates, or clears Tags before saving the Employee form
- **THEN** every current draft Tag is visible inside the wrapping trigger and organization state remains unchanged

#### Scenario: Save draft Tags
- **WHEN** the user saves a valid Employee form after editing Tags
- **THEN** the final draft Tags are committed together with the Employee and ordinary persistence runs once

#### Scenario: Use Unit terminology in Editor mode
- **WHEN** an Editor-originated Employee form renders or fails Unit validation
- **THEN** it uses only the generic localized Unit label, picker name, and validation message
