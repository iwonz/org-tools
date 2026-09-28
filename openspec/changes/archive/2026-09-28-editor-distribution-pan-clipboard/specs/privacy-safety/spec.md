## ADDED Requirements

### Requirement: Editor clipboard ownership markers disclose no organization data
Editor structural Copy SHALL keep complete clipboard content only in current-tab memory. The system
clipboard marker MAY contain a random token and fixed format identifier but MUST NOT contain Unit,
Employee, Tag, canvas, View, organization, or State content. The token MUST NOT enter persistent
State, SQLite, BroadcastChannel, browser storage, logs, URLs, exports, or network requests and MUST
be invalid without an exact matching in-memory Editor clipboard.

#### Scenario: Inspect a structural clipboard marker
- **WHEN** selected Editor content is copied through keyboard or context-menu action
- **THEN** the system clipboard contains only an opaque ownership marker while the structural payload remains in current-tab memory

#### Scenario: Load complete State
- **WHEN** complete State replacement clears the transient Editor clipboard
- **THEN** any older system marker cannot paste or recover the removed payload
