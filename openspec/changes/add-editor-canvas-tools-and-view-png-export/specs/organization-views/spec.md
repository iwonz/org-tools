## ADDED Requirements

### Requirement: Views own isolated canvas elements
Every system or custom View SHALL own an ordered canvas-element document independent from every
other View. Canvas elements SHALL participate in View-local history, document equality, automatic
SQLite persistence, live-tab synchronization, and complete View cloning. View UI selection MAY
reference only elements belonging to that View.

#### Scenario: Create or copy a View
- **WHEN** a blank View is created or a complete View is copied
- **THEN** the blank View receives an empty element array and the copy receives equivalent elements with regenerated element and Unit IDs plus remapped internal anchors

#### Scenario: Synchronize an element command
- **WHEN** a canvas element command commits in server or Pages mode
- **THEN** the active View document persists and synchronizes through the existing local mechanisms without changing another View

### Requirement: View clipboard preserves valid element relationships
Copying selected Units SHALL include their descendant closure and transitively related annotations
using the scoped Image inclusion rule. Explicitly selected elements SHALL also be copied. Same-View
Paste SHALL retain valid external anchors, while cross-View Paste SHALL remap included Unit,
Employee-occurrence, and element anchors and materialize unavailable external references as free
fallback geometry.

#### Scenario: Paste a connected diagram into another View
- **WHEN** copied Units and their related tools are pasted into another View
- **THEN** cloned elements reference the cloned Units and elements, global Employee IDs remain stable, and no source-only reference enters the target View

#### Scenario: Delete a selected target
- **WHEN** Unit, Employee, and canvas-element targets are deleted through one mixed selection
- **THEN** the operation removes selected content, detaches surviving dependents, clears stale selection, and is restored exactly by one Undo

