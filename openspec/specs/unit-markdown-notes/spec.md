# Unit Markdown Notes Specification

## Purpose

Define bounded View-local Unit notes, their draft-safe Editor workflow, and inert local Markdown
rendering.

## Requirements

### Requirement: Units retain bounded View-local Markdown notes
Every Unit SHALL contain one `noteMarkdown` source string owned by its View document. The source
MUST use LF line endings, MUST NOT exceed 64 KiB when UTF-8 encoded, and SHALL save whitespace-only
content as an empty string. A new Unit SHALL start with an empty note.

#### Scenario: Save a Unit note
- **WHEN** the user saves a valid changed Markdown draft
- **THEN** the target Unit note and timestamp change in one View-local history command and one
  organization persistence notification

#### Scenario: Reject an oversized note
- **WHEN** a draft exceeds 64 KiB in UTF-8
- **THEN** Save shows a localized validation error and the Unit, history, and persisted state remain
  unchanged

#### Scenario: Undo a note edit
- **WHEN** the user undoes a saved note edit
- **THEN** only the note and timestamp in that Unit's View return to their prior values

### Requirement: Unit cards expose a geometry-neutral note action
Each Unit card SHALL place one thematic note action in its logical top corner without changing card
bounds or content flow. An empty note action SHALL be visually hidden until card hover,
focus-within, or direct focus. A nonempty note action SHALL remain visible with semantic signal
color and restrained tonal fill. The action MUST NOT have a border, shadow, tooltip, or native
title and MUST NOT initiate canvas drag or selection.

#### Scenario: Reveal an empty note action
- **WHEN** a pointer hovers the Unit card or keyboard focus reaches its note action
- **THEN** the action becomes visible without shifting the Unit or adjacent header content

#### Scenario: Show a note indicator
- **WHEN** trimmed note content is nonempty and the Unit is not hovered
- **THEN** the active note action remains visibly signal-colored

#### Scenario: Activate during a canvas gesture
- **WHEN** the user presses and activates the note action
- **THEN** the note dialog opens and no Unit drag, selection change, or geometry command begins

### Requirement: The note dialog is Preview-first and draft-safe
The note dialog SHALL select Preview every time it opens and SHALL provide adjacent Preview and
Editor tabs with leading thematic icons. Editor changes SHALL remain transient until explicit Save,
while Preview SHALL render the current draft. Closing a changed draft by any route SHALL require
confirmation before discarding it.

#### Scenario: Open an existing note
- **WHEN** the user opens a Unit with saved Markdown
- **THEN** Preview is active and renders the saved content

#### Scenario: Preview unsaved Markdown
- **WHEN** the user edits the draft and switches to Preview
- **THEN** Preview renders the draft without changing the Unit or persisted state

#### Scenario: Discard a changed draft
- **WHEN** the user confirms discard after closing a changed draft
- **THEN** the dialog closes and the saved Unit note remains unchanged

#### Scenario: Clear a note
- **WHEN** the user clears the Editor field and saves
- **THEN** the Unit stores an empty note and its always-visible active indicator disappears

### Requirement: Markdown preview is local and inert
Preview SHALL support headings, paragraphs, lists, tables, task lists, block quotes, emphasis,
strikethrough, links, inline code, and fenced code through a local GFM renderer. It MUST NOT execute
raw HTML, render active embedded content, or issue image requests. Links SHALL navigate only after
an explicit user click with no opener and no referrer.

#### Scenario: Render GFM
- **WHEN** a valid note contains supported GFM syntax
- **THEN** Preview renders accessible local document semantics without mutating the source

#### Scenario: Render unsafe content
- **WHEN** a note contains raw HTML or image syntax
- **THEN** no HTML executes, no image resource is requested, and inert alternative text is shown

#### Scenario: Follow a note link
- **WHEN** the user explicitly activates an allowed Markdown link
- **THEN** it opens with `noopener`, `noreferrer`, and no-referrer protection
