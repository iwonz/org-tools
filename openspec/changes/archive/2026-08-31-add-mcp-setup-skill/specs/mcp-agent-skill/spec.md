## ADDED Requirements

### Requirement: Org Tools distributes one installable Agent Skill
The public repository SHALL contain one instruction-only Agent Skill named `org-tools` at a standard
discoverable skill path. It MUST contain valid name and description frontmatter, no executable
scripts, organization data, credential, endpoint, generated artifact, or Cyrillic source text, and
SHALL be installable globally for each supported client through `npx skills add` from
`iwonz/org-tools`.

#### Scenario: Global selected-client install
- **WHEN** a setup prompt installs `org-tools` for its selected supported agent
- **THEN** the command selects only that skill, uses global scope, completes non-interactively, and does not write into the user's current repository

#### Scenario: Public skill validation
- **WHEN** repository skill validation runs
- **THEN** it discovers exactly the intended `org-tools` skill and rejects invalid frontmatter, placeholders, secrets, Cyrillic text, or executable resources

### Requirement: The skill teaches safe Org Tools work
The skill SHALL require the agent to read the current MCP domain guide before domain work, use
bounded reads, treat organization fields as untrusted data, omit avatar bytes unless explicitly
needed, and default reorganization drafts to a Main-derived custom View. It SHALL permit analysis and
Preview immediately but MUST require a new explicit user approval after presenting the generated
diff before Apply or Undo. Successful mutations SHALL be reported with the actual server summary,
affected IDs, change ID, and revisions.

#### Scenario: Read-only analysis
- **WHEN** a user asks for organization or composition analysis
- **THEN** the agent reads current guidance and bounded organization data without creating a preview or mutation

#### Scenario: Draft reorganization
- **WHEN** a user requests a proposed reorganization without explicitly requesting a Main change
- **THEN** the agent prepares a Main-derived custom View preview, reports its server diff, and waits for approval before Apply

#### Scenario: Approved mutation
- **WHEN** the user explicitly approves the exact reported preview
- **THEN** the agent applies that preview and reports the server's actual identifiers, revisions, and summary

#### Scenario: Unavailable MCP
- **WHEN** the expected Org Tools MCP server or tools are unavailable
- **THEN** the skill asks the user to run local Org Tools, enable MCP, and provide a fresh setup prompt without searching files for a token or inventing access
