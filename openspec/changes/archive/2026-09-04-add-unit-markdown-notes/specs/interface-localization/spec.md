## ADDED Requirements

### Requirement: Unit note surfaces are localized in every supported locale
The note action, dialog, tabs, empty state, validation, discard confirmation, controls, and accessibility labels SHALL have complete English, Simplified Chinese, Russian, Spanish, French, and
Modern Standard Arabic catalog entries. Arabic SHALL preserve the LTR Editor world coordinates
while mirroring dialog layout and Markdown prose direction.

#### Scenario: Open a localized note
- **WHEN** the note dialog opens in any supported locale
- **THEN** every visible and accessible interface string comes from that locale without fallback keys

#### Scenario: Edit a note in Arabic
- **WHEN** the locale is Arabic
- **THEN** dialog controls and prose use RTL direction while Unit canvas geometry remains unchanged
