## ADDED Requirements

### Requirement: View and clipboard operations preserve Unit notes
Unit notes SHALL remain part of the isolated structural document. View copying and Unit Copy/Paste
SHALL copy the source Markdown, while later edits SHALL affect only the target Unit. Cross-View note
Paste SHALL use the target View history and persistence lifecycle.

#### Scenario: Copy a View with notes
- **WHEN** a custom View is created as a copy of a View containing noted Units
- **THEN** the new Units receive remapped IDs and the same note sources without sharing later edits

#### Scenario: Paste a noted Unit into another View
- **WHEN** a copied Unit with a note is pasted into another View
- **THEN** the new Unit keeps the note and Undo affects only the target View
