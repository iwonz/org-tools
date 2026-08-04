## 1. Shared chrome

- [x] 1.1 Remove internal header and footer rules from shared Dialog and AlertDialog primitives
- [x] 1.2 Remove decorative rules from the app header, tab navigation, and status bands

## 2. Product surfaces

- [x] 2.1 Clean Employees, Analytics, Calendar, and Units headers while preserving pane and calendar boundaries
- [x] 2.2 Clean Download, selected-Employee, and Org Editor internal section rules

## 3. Lists and overlays

- [x] 3.1 Replace filter, tag, event, mapping, and virtual list row rules with spacing and interaction feedback
- [x] 3.2 Remove local Import and image-export section rules while preserving Import operation grouping and destructive treatment
- [x] 3.3 Remove the obsolete SelectedEmployeesPanel header-border option and update callers

## 4. Coverage and documentation

- [x] 4.1 Add browser assertions for borderless chrome, preserved meaningful outlines, scrollable dialogs, and 390 px Import layout
- [x] 4.2 Update usage, performance, and screenshot documentation and regenerate the deterministic gallery

## 5. Delivery

- [x] 5.1 Run format, lint, typecheck, unit tests, build, browser smoke, screenshots, strict OpenSpec validation, and public safety checks
- [x] 5.2 Sync capability deltas, archive the completed change, and create the meaningful style commit
