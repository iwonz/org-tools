## ADDED Requirements

### Requirement: The current state accepts all supported locales
The strict `ui.locale` value SHALL be exactly `en`, `zh`, `ru`, `es`, `fr`, or `ar`. Existing state
and an explicit selected locale SHALL override browser detection. Only a blank state without a valid
preference SHALL use the first supported browser language or English fallback.

#### Scenario: Parse a supported locale
- **WHEN** strict current state contains any of the six locale values
- **THEN** both runtimes hydrate it without changing organization data or persistence shape

#### Scenario: Reject an unknown locale
- **WHEN** current state contains another locale value
- **THEN** strict parsing rejects the state atomically without a compatibility fallback

#### Scenario: Bootstrap a blank state
- **WHEN** no authoritative state or valid locale metadata exists
- **THEN** the first supported browser language initializes locale and English remains the fallback
