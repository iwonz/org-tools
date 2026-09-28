## MODIFIED Requirements

### Requirement: One keyboard paste gesture creates one Editor copy
The Editor SHALL arbitrate keyboard copy, keyboard paste, browser clipboard events, and fallback so
one Ctrl/Cmd+V gesture invokes at most one action. A successful structural copy SHALL assign an
opaque transient token and place only a content-free ownership marker in the system clipboard. A
paste marker matching the current in-memory Editor clipboard SHALL paste that structure even when an
older image representation is also present. Without a matching marker, a supported local image SHALL
insert only the image and explicit foreign content SHALL NOT paste stale Editor structure. A missing
browser paste event SHALL invoke one structural fallback when the Editor clipboard exists. Later
intentional gestures and context-menu Copy or Paste SHALL remain independent.

#### Scenario: Copy and paste structure between Views
- **WHEN** a user copies selected Units with Ctrl/Cmd+C, switches View, and presses Ctrl/Cmd+V
- **THEN** one remapped structural copy is added in one undoable target-View operation

#### Scenario: Match a structural marker over an old image
- **WHEN** the current clipboard event contains an ownership marker matching the Editor clipboard and an older supported image representation
- **THEN** one structural copy is inserted and no image is created

#### Scenario: Copy an image later
- **WHEN** an external supported image replaces the structural marker before Ctrl/Cmd+V
- **THEN** one image is inserted and no structural clipboard copy is added

#### Scenario: Paste unsupported foreign content
- **WHEN** a browser paste event contains foreign text, a mismatched marker, or another unsupported payload
- **THEN** neither stale Editor structure nor a canvas image is inserted

#### Scenario: Browser emits key and paste events
- **WHEN** one keyboard paste gesture emits both events in either supported order
- **THEN** exactly one matching action is added in one undoable operation

#### Scenario: Browser omits the paste event
- **WHEN** a keyboard paste gesture has no browser paste event and an Editor clipboard exists
- **THEN** the fallback adds exactly one structural copy

#### Scenario: Browser emits a late paste event
- **WHEN** structural fallback has completed and the browser later emits the same gesture's paste event
- **THEN** the event is consumed without adding a second structure or image

#### Scenario: Use context-menu clipboard actions
- **WHEN** a user copies or pastes Editor content through its context menu
- **THEN** the shared cross-View clipboard retains its existing behavior even if the system marker write is unavailable
