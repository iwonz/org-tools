## MODIFIED Requirements

### Requirement: Template formats use one token-aware input
Data Download, Editor Template export, and custom Employee Template definitions SHALL use one shared
multiline Format input and SHALL NOT render separate token-button catalogs. Every such input SHALL
place a compact focusable help icon immediately after its Format label. Hovering or focusing the
icon SHALL explain that typing `@` opens token suggestions, and the input placeholder SHALL provide
the same concise discovery cue. Typing `@` immediately before the caret SHALL open a caret-positioned
bordered suggestion menu containing the matching `{token}` and a localized short description.
Matching MUST be case-insensitive by substring across token keys and descriptions. Choosing a token
SHALL replace only the active `@query` with the existing `{token}` syntax and place the caret after
it. Manual `{token}` values and conditional expressions SHALL retain their existing formatter behavior.

#### Scenario: Discover token suggestions
- **WHEN** a user hovers or focuses the help icon beside any token-aware Format label
- **THEN** localized guidance explains that typing `@` opens token suggestions without changing the field value

#### Scenario: See the token placeholder
- **WHEN** a token-aware Format field is empty
- **THEN** its localized placeholder indicates that `@` can add tokens

#### Scenario: Insert a token with the keyboard
- **WHEN** a user types `@name`, changes the active suggestion with Arrow Up or Arrow Down, and presses Enter
- **THEN** the matching `{token}` replaces `@name`, focus remains in Format, and the caret follows the inserted token

#### Scenario: Insert a token with the pointer
- **WHEN** the suggestion menu is open and the user activates an option
- **THEN** the active `@query` is replaced without changing text outside that range

#### Scenario: Close without insertion
- **WHEN** the menu is open and the user presses Escape or Tab
- **THEN** the menu closes, no suggestion is inserted, and the Format value remains unchanged

#### Scenario: Preserve a literal at sign
- **WHEN** the user types whitespace after an active `@query`
- **THEN** the menu closes and the literal typed text remains unchanged

#### Scenario: Dismiss before deleting
- **WHEN** the menu is open and the user presses Backspace
- **THEN** the first press only closes the menu and a subsequent Backspace edits the Format value normally
