## Context

The application is a single-route Next.js static export. Its React components, MobX stores, import
pipeline, validation helpers, analytics projections, and accessibility labels currently construct
English strings directly. Theme is already a non-sensitive local preference, while organization
state remains memory- and file-only. Locale must therefore resolve entirely in the browser without
making routing, server, or organization-state changes.

## Goals / Non-Goals

**Goals:**

- Provide complete English and Russian runtime interfaces with immediate client-side switching.
- Detect and persist a supported locale without rendering a wrong-language frame.
- Keep locale-derived presentation outside normalized organization and analytics state.
- Preserve static export, privacy guarantees, workspace compatibility, and performance targets.

**Non-Goals:**

- Additional locales, locale URL segments, middleware, server negotiation, remote catalog loading,
  or preference synchronization.
- Translation of imported/user-authored content, serialized keys, export values, or filenames.

## Decisions

### Client-only provider with bundled catalogs

`next-intl` is used through `NextIntlClientProvider`, `useTranslations`, `useFormatter`, and
`useLocale`. English and Russian JSON catalogs are statically imported so language changes cause no
network request. A locale provider renders a locale-neutral full-page state until an effect resolves
the preference, then supplies the selected catalog. This avoids hydration mismatch and an English
flash in Russian browsers. Internationalized routing and request configuration are deliberately not
installed because the static application has one URL and no request-time locale source.

### Independent bounded preference

The locale is `en` or `ru` and is stored under `org-tools-locale`. A valid stored value wins; absent
or invalid storage selects the first supported primary language from `navigator.languages`, with
English as fallback. Storage read/write failures are non-fatal. Selection updates provider state,
`document.documentElement.lang`, and localized document metadata. It does not enter MobX workspace
state, and opening a workspace cannot change it.

### Semantic messages at presentation boundaries

React surfaces translate namespaced message IDs. Pure helpers and stores do not capture a locale;
surfaceable failures and derived labels carry stable typed message descriptors plus primitive
parameters. UI boundaries format descriptors using the current provider. Third-party parser and
browser failures are mapped to owned descriptors instead of exposing raw English messages.

Analytics keeps raw months, days, and a missing-position sentinel rather than localized labels, so
the expensive derived result remains reusable after a locale change. Import collection labels also
retain source paths/counts rather than formatted English. User-visible ordering uses a memoized
`Intl.Collator` for the active locale; identifier normalization, search indexes, and deterministic
canvas layout remain locale-independent.

### Translation contract and publication boundary

The English catalog defines the TypeScript `next-intl` message shape. A recursive unit test requires
the Russian catalog to have exactly the same non-empty leaves. ICU messages own plural categories,
and next-intl formatters own presentation numbers, file sizes, months, and dates. Product source,
tests, fixtures, specs, and docs remain English; the publication scanner exempts only the exact
Russian catalog path from its Cyrillic rule. Browser tests read expected Russian text from that
catalog instead of embedding Cyrillic in test source.

### Stable persisted and export contracts

`OrgToolsStateV1`, import aliases, search normalization, output field keys, filenames, and user data
do not change. The built-in Main View remains serialized as `Main` but is rendered from its `kind` as
a localized product label. Localized draft defaults are captured as ordinary user data once saved
and are never retranslated.

`next-intl` is justified as the requested ICU/message/formatting runtime. It has no configured
transport, telemetry, or storage and receives only local static catalogs and primitive UI values.

## Risks / Trade-offs

- [A missed literal leaves part of the UI English] → Inventory all component text, accessibility
  attributes, notices, and surfaced errors; enforce catalog parity and exercise every product
  surface in both locales.
- [Russian strings overflow existing controls] → Use the compact selector and inspect representative
  desktop viewports and regenerated screenshots.
- [Locale reads fail in restricted browsers] → Continue with the in-memory detected locale and make
  preference persistence best-effort.
- [Locale-derived labels invalidate analytics caches] → Store semantic values and localize only at
  render time.
- [A broad Cyrillic exception hides accidental public text] → Exempt one exact catalog path only.

## Migration Plan

Add the provider and catalogs, migrate shared formatting/errors and every UI surface, then update
tests, documentation, and the scanner. No state migration or data rollback is required. Reverting
the change removes the provider/catalog dependency and preference key; existing workspace files are
unchanged.

## Open Questions

None.
