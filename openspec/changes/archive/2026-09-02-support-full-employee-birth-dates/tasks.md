## 1. Birthday contract

- [x] 1.1 Replace birthday parsing and formatting with strict canonical `DD.MM.YYYY`, reserved `1900` unknown-year semantics, and leap-day-safe helpers.
- [x] 1.2 Apply the shared birthday validator to strict state parsing, mapped Employee Import, fixtures, and performance data without compatibility readers.
- [x] 1.3 Add unit coverage for known dates, sentinel dates, leap days, obsolete formats, impossible dates, and future years.

## 2. Employee and derived workflows

- [x] 2.1 Add coordinated styled Day, Month, and Year selectors to Employee create/edit with localized unknown-year and incomplete-date behavior.
- [x] 2.2 Update Calendar, Analytics, search/filter indexes, Data Download, and Editor export to derive recurring keys while retaining full birthday output.
- [x] 2.3 Extend browser coverage for create/edit, mapped Import, complete-state Import, recurring Calendar behavior, and JSON/Template output in both locales.

## 3. State, documentation, and gallery

- [x] 3.1 Rewrite the stopped local SQLite singleton birthday values transactionally and verify organization preservation, one revision increment, and production-parser acceptance.
- [x] 3.2 Update README, architecture, privacy, performance, usage, import-format, screenshot documentation, and catalog metadata for complete birthdays and the unknown-year sentinel.
- [x] 3.3 Regenerate all 38 screenshots twice, inspect every scenario in both themes and locales, and verify deterministic SHA-256 hashes.

## 4. Verification and delivery

- [x] 4.1 Run format, lint, typecheck, unit, dev check, server and Pages production builds, both browser suites, Pages/public checks, strict OpenSpec validation, and `git diff --check`.
- [x] 4.2 Synchronize canonical specs, archive the completed change, validate no active OpenSpec changes, and review the staged set for generated or private artifacts.
- [x] 4.3 Commit meaningfully, integrate into synchronized `main`, push GitHub, remove the merged change branch, and verify clean matching `HEAD`, `main`, and `origin/main`.
