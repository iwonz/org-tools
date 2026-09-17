## MODIFIED Requirements

### Requirement: View operations preserve local open positions

Open positions SHALL belong only to their containing Unit document. View cloning and Unit/subtree
copy and paste MUST preserve their titles, Tag assignments, and nullable background colors,
regenerate position UUIDs, and remap all internal selection-independent canvas references. An open
position MUST NOT be copied or pasted as a standalone Employee-like entity.

#### Scenario: Clone a View with attached positions
- **WHEN** a View containing transparent or colored open positions and canvas attachments is copied
- **THEN** every Unit, open position, and canvas element receives the required new UUID, every
  position retains its background, and every internal attachment resolves inside the cloned View

#### Scenario: Paste a Unit subtree
- **WHEN** a copied Unit subtree containing positions is pasted in the same or another View
- **THEN** its positions are recreated with new IDs and unchanged backgrounds, included attachment
  targets are remapped, and unavailable external targets detach at their copied fallback coordinates

#### Scenario: Copy only a selected position
- **WHEN** only an open-position row is selected and Copy is invoked
- **THEN** no standalone position clipboard payload is created
