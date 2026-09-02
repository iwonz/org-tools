## ADDED Requirements

### Requirement: The canonical Editor View uses destination terminology
The interface SHALL label the canonical Editor View with the existing localized Units destination
term in English and Russian.
Related visible copy for copying from the canonical View, Employee membership, and destructive
warnings SHALL use the same localized product term without changing machine-facing `main` values,
MCP terminology, or user-authored custom View names.

#### Scenario: English canonical View copy
- **WHEN** the Editor and related workflows render in English
- **THEN** the canonical View and related user-facing phrases use `Units` rather than `Main`

#### Scenario: Russian canonical View copy
- **WHEN** the Editor and related workflows render in Russian
- **THEN** the canonical View and related user-facing phrases use the Russian Units destination term rather than the former dedicated Main label

#### Scenario: Machine contracts remain stable
- **WHEN** state is imported, exported, persisted, synchronized, or accessed through MCP
- **THEN** canonical View kind and field values remain unchanged and only localized display copy differs
