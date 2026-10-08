## 1. Employee assignment behavior

- [x] 1.1 Remove the Editor-only minimum-Unit gate so create and edit submit empty assignment arrays.
- [x] 1.2 Remove the obsolete validation key from all six localization catalogs.
- [x] 1.3 Document unassigned Employees and synchronize the Employee model capability requirement.

## 2. Regression coverage

- [x] 2.1 Add store tests for clearing the final assignment, active-View isolation, global Employee retention, and Undo/Redo.
- [x] 2.2 Add authorization coverage proving allowed scoped removal succeeds and unauthorized removal rolls back atomically.
- [x] 2.3 Add browser coverage for editing an Employee to no Units, saving, reopening, and assigning the Employee again.

## 3. Validation and delivery

- [x] 3.1 Run formatting, lint, typecheck, unit, development, production build, browser, public-safety, and strict OpenSpec checks plus `git diff --check`.
- [x] 3.2 Generate the 56-image gallery twice, compare SHA-256 hashes, and inspect every PNG for regressions.
- [x] 3.3 Synchronize and archive the OpenSpec change, integrate current `origin/main`, push `main`, delete the change branch, and verify clean matching refs with no active changes.
