## MODIFIED Requirements

### Requirement: Organization data remains local
The application SHALL not transmit workspace state, imported rows, structured previews, search
terms, analytics, examples, or exports, SHALL make no background external requests, and SHALL keep
organization data out of cookies, IndexedDB, session storage, and local storage. It MAY persist only
bounded non-sensitive UI preferences such as theme and locale in local storage.

#### Scenario: Core workflow network audit
- **WHEN** a user edits, imports tabular or structured data, inspects/copies/downloads examples, searches, analyzes, exports, and changes locale in a workspace
- **THEN** browser requests are limited to the locally served application assets

#### Scenario: Locale preference persistence
- **WHEN** a user selects an interface locale
- **THEN** local storage contains only the locale identifier and no organization data

#### Scenario: Cancel partial import
- **WHEN** a user previews and cancels a structured import
- **THEN** neither browser persistence nor the in-memory organization state receives imported data
