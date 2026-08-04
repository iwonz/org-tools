## MODIFIED Requirements

### Requirement: Organization data remains local
The application SHALL not transmit workspace state, imported rows, search terms, analytics, or
exports, SHALL make no background external requests, and SHALL keep organization data out of
cookies, IndexedDB, session storage, and local storage. It MAY persist only bounded non-sensitive UI
preferences such as theme and locale in local storage.

#### Scenario: Core workflow network audit
- **WHEN** a user edits, imports, searches, analyzes, exports, and changes locale in a workspace
- **THEN** browser requests are limited to the locally served application assets

#### Scenario: Locale preference persistence
- **WHEN** a user selects an interface locale
- **THEN** local storage contains only the locale identifier and no organization data
