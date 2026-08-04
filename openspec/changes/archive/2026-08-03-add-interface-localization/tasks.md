## 1. Locale foundation

- [x] 1.1 Add `next-intl`, typed English/Russian catalogs, locale resolution, preference storage, and catalog parity tests
- [x] 1.2 Add the client provider, locale context, localized document metadata, and neutral pre-resolution state
- [x] 1.3 Add the Russian/English selector before the localized theme selector

## 2. Complete interface migration

- [x] 2.1 Localize the application shell, shared controls, Units, Employees, Views, and accessibility text
- [x] 2.2 Localize search, Live Unit, Org Editor, canvas dialogs, and editor notices
- [x] 2.3 Localize import, export, Calendar, and Analytics surfaces with ICU plurals and locale formatters
- [x] 2.4 Convert surfaced validation failures and locale-derived import/analytics labels to semantic messages

## 3. Privacy, documentation, and automation

- [x] 3.1 Update privacy/architecture/usage guidance, repository language rules, and the exact catalog scanner exception
- [x] 3.2 Add English and Russian browser coverage for detection, switching, persistence, metadata, workflows, and local-only requests
- [x] 3.3 Keep screenshot generation explicitly English and inspect localized layouts at representative desktop sizes

## 4. Validation

- [x] 4.1 Run format, lint, typecheck, unit tests, build, strict OpenSpec validation, and public-safety checks
- [x] 4.2 Run browser smoke and screenshot generation, then manually inspect every generated PNG

## 5. Localized layout regression

- [x] 5.1 Keep the localized Org Editor View label on one line, show the built-in Russian label in full, and contain longer user-authored names with an ellipsis
- [x] 5.2 Add a browser regression for selector containment and visually inspect the Russian Org Editor toolbar
- [x] 5.3 Run focused checks and strict OpenSpec validation
