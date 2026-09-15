## ADDED Requirements

### Requirement: Canvas images remain local and bounded
Canvas Image insertion SHALL occur only after explicit file selection or image clipboard paste and
SHALL accept only bounded embedded PNG, JPEG, or WebP bytes. The application MUST NOT fetch a canvas
image URL, upload an input or generated image, include remote asset references, or persist temporary
object URLs. Adding an image SHALL fail atomically when its validated dimensions or resulting
complete State exceed an established bound.

#### Scenario: Insert and export a local image
- **WHEN** the user inserts a valid local image and exports a View PNG
- **THEN** source bytes, preview, copy, save, persistence, and live-tab synchronization remain inside the browser and loopback same-origin runtime without a network request

#### Scenario: Reject a remote or oversized image
- **WHEN** an insertion or imported State supplies a remote, unsupported, oversized, or over-pixel image
- **THEN** no element is committed, no remote request occurs, and the previous state remains unchanged

