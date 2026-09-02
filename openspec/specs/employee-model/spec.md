# employee-model Specification

## Purpose
Define persisted Employee fields, Unit-scoped roles, and safe profile and avatar values.

## Requirements

### Requirement: Employees use generic persisted fields
The system SHALL persist Employee identity, contact, profile, embedded avatar, birthday, normalized
gender, and tags as unique label and optional-date records without source-specific IDs, origins, or
remote photo fields. Gender SHALL be exactly `male`, `female`, or `unspecified` and
SHALL NOT be inferred from any other Employee value.

#### Scenario: Employee persistence
- **WHEN** an Employee is created, edited, saved, and reopened
- **THEN** `firstName`, `lastName`, `email`, `username`, `profileUrl`, `avatarBase64Url`, `phone`,
  `birthday`, `gender`, and normalized tag labels and dates retain their values

#### Scenario: Invalid gender
- **WHEN** a strict Employee record contains a missing or unknown gender value
- **THEN** validation rejects the complete operation without changing organization state

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
