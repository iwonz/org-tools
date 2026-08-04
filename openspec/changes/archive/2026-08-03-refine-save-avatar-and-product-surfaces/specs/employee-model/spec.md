## ADDED Requirements

### Requirement: Employee avatars can be selected and cropped locally
The application SHALL accept an explicit local PNG, JPEG, or WebP file or image clipboard item,
present a 1:1 pan and zoom crop interface, and store only a validated 512 by 512 WebP data URL in the
Employee draft.

#### Scenario: Select and crop avatar
- **WHEN** a supported image within the source byte and pixel limits is selected or pasted and the crop is confirmed
- **THEN** the form preview uses the locally encoded bounded WebP without a network request

#### Scenario: Invalid avatar source
- **WHEN** the source type, byte size, decoded dimensions, clipboard permission, image decode, or final encoded size is invalid
- **THEN** the draft remains unchanged and an owned localized error is shown

### Requirement: Existing avatars can be adjusted or removed
The application SHALL allow an existing saved avatar to be re-cropped from its current square,
replaced from file or clipboard, or cleared without persisting the original source image.

#### Scenario: Cancel avatar edit
- **WHEN** the crop dialog is canceled or the Employee form closes without saving
- **THEN** the persisted Employee avatar remains unchanged and temporary image resources are released

#### Scenario: Remove avatar
- **WHEN** the user clears an avatar and saves the Employee form
- **THEN** `avatarBase64Url` becomes null and the initials fallback is displayed
