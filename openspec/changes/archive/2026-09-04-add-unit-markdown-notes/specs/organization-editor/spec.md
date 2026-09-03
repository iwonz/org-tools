## ADDED Requirements

### Requirement: Editor note interaction preserves canvas rendering
The Editor SHALL expose Unit notes without including the note action or note content in PNG output,
Unit geometry, spatial indexing, snapping, connections, or collision resolution. Closed note
content MUST NOT be parsed during canvas rendering.

#### Scenario: Render a canvas with notes
- **WHEN** visible Units contain saved notes but no note dialog is open
- **THEN** Unit geometry matches note-free cards and no Markdown parser processes their content

#### Scenario: Export a noted Unit to PNG
- **WHEN** the user exports a Unit or subtree containing notes as an image
- **THEN** the PNG contains the existing organization card content without note icons or Markdown
