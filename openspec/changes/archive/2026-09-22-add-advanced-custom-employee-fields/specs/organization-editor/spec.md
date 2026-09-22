## ADDED Requirements

### Requirement: One keyboard paste gesture creates one Editor copy
The Editor SHALL arbitrate the keyboard event, browser paste event, and fallback so one Ctrl/Cmd+V gesture invokes structural paste at most once. A browser paste containing an image SHALL insert only the image. A missing browser paste event SHALL invoke one structural fallback, and later intentional gestures and context-menu Paste SHALL remain independent.

#### Scenario: Browser emits key and paste events
- **WHEN** one keyboard paste gesture emits both events in either supported order
- **THEN** exactly one structural copy is added in one undoable operation

#### Scenario: Browser omits the paste event
- **WHEN** a keyboard paste gesture has no browser paste event
- **THEN** the fallback adds exactly one structural copy

#### Scenario: Paste an image
- **WHEN** the clipboard paste event contains a supported local image
- **THEN** one image is inserted and no structural clipboard copy is added
