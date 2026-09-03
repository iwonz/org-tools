## ADDED Requirements

### Requirement: Distribution mode is localized in every bundled locale
The distribution workflow MUST have complete catalog entries in every bundled locale. This includes
the context action, enabled state, source-only status, distributed status, other-Unit count, and
accessibility labels in English, Simplified Chinese, Russian, Spanish, French, and Modern Standard
Arabic.

#### Scenario: Use distribution mode in any locale
- **WHEN** the workflow opens in any supported locale
- **THEN** visible and accessible copy uses that catalog without fallback keys or unexpected English

#### Scenario: Use distribution mode in Arabic
- **WHEN** the active locale is Arabic
- **THEN** context controls follow RTL direction while row anchors and canvas paths retain LTR geometry
