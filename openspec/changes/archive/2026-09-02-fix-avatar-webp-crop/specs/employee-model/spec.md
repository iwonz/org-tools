## MODIFIED Requirements

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
