## ADDED Requirements

### Requirement: Complete State requires exact canvas elements
Every current View structure SHALL contain a `canvasElements` array whose entries use the exact Text,
Sticker, Image, or Arrow shape. Complete State validation SHALL require unique UUIDs, supported
discriminators and exact keys, finite bounded geometry, valid layer and style values, bounded UTF-8
content, same-View target references, valid anchor IDs, acyclic element dependencies, and safe
embedded Image data. View UI element selections SHALL reference existing elements. Validation MUST
remain atomic and MUST NOT add a format version, migration, or compatibility reader.

#### Scenario: Round-trip canvas elements
- **WHEN** a valid complete State containing attached elements is exported and imported
- **THEN** element order, geometry, style, image bytes, attachment references, and selection are preserved exactly after normalization

#### Scenario: Reject the former View shape
- **WHEN** complete State omits `structure.canvasElements`
- **THEN** the candidate is rejected atomically without changing memory, SQLite, or live peers

#### Scenario: Reject invalid element relationships
- **WHEN** canvas elements contain a duplicate ID, missing target, invalid anchor, self-reference, or dependency cycle
- **THEN** the complete candidate is rejected before replacement

#### Scenario: Reject unsafe image data
- **WHEN** an Image element contains a remote URL, unsupported MIME, malformed base64, mismatched intrinsic dimensions, more than 25 MiB compressed bytes, or more than 40 megapixels
- **THEN** the complete candidate is rejected without decoding or fetching remote content

