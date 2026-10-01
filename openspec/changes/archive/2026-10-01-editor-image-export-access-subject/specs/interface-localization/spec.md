## ADDED Requirements

### Requirement: Export-as controls and permission are localized
All six bundled locales SHALL provide user-facing labels for the reserved permission, export-subject
control, current-access option, search, loading, error, and unavailable states. Raw permission IDs
MUST NOT appear in Administration or image-export UI.

#### Scenario: Open image export in any locale
- **WHEN** a Super Administrator opens either PNG dialog in English, Russian, Spanish, French, Arabic, or Simplified Chinese
- **THEN** the selector and every state use bundled localized copy and logical alignment, including RTL Arabic
