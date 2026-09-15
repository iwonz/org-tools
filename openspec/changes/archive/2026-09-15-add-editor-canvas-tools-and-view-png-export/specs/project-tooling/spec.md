## ADDED Requirements

### Requirement: Gallery demonstrates canvas tools and complete View export
The deterministic 59-frame gallery SHALL keep its existing frame count while updating the featured
Editor frame to show the tools surface and representative Text, Sticker, embedded Image, and curved
Arrow elements. The Editor image-export and image-settings frames SHALL show the complete View
preview, selected density, actual dimensions, and shared settings using obviously synthetic embedded
content.

#### Scenario: Generate the updated gallery twice
- **WHEN** the maintained screenshot workflow runs twice from the same clean production state
- **THEN** every PNG is visually valid, the second run has identical hashes, no real organization or remote image appears, and the catalog still contains exactly 59 frames

### Requirement: Canvas interaction retains large-Editor bounds
Automated checks SHALL cover canvas-element spatial queries, dependency resolution, frame-coalesced
previews, image validation, both production runtimes, and full/scoped PNG output while preserving the
20,000-Employee and 4,000-Unit target.

#### Scenario: Interact with a large annotated Editor
- **WHEN** pointer preview or anchor snapping runs in a large Editor with canvas elements
- **THEN** it examines bounded nearby spatial candidates, updates only the affected dependency closure, and performs no persistent write until one final commit

