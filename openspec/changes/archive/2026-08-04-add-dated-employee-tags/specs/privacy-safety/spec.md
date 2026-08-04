## MODIFIED Requirements

### Requirement: Organization data remains local
The application SHALL not transmit workspace state, imported rows, structured previews, Employee tag dates, calendar events, avatar sources or crop results, search terms, analytics, examples, or exports, SHALL make no background external requests, and SHALL keep organization data out of cookies, IndexedDB, session storage, and local storage. It MAY persist only bounded non-sensitive UI preferences such as theme and locale in local storage.

#### Scenario: Core workflow network audit
- **WHEN** a user edits dated tags, opens calendar event dialogs, imports or saves structured data, searches, analyzes, exports, and changes locale
- **THEN** browser requests are limited to the locally served application assets

#### Scenario: Locale preference persistence
- **WHEN** a user selects an interface locale
- **THEN** local storage contains only the locale identifier and no organization data or tag dates

#### Scenario: Cancel transient operation
- **WHEN** a user cancels a tag-date edit, structured preview, Save dialog, avatar source, or crop
- **THEN** browser persistence and the in-memory organization state receive none of the canceled data
