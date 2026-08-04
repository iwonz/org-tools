## Context

The shell owns one global notice row. Replacement state imports currently populate it with the
source filename, so every subsequently rendered product surface and deterministic screenshot gains
a redundant horizontal band. Employees has a search/create toolbar but no catalog summary.
Analytics already avoids cards and uses virtualization, yet each group has a title rule, every row
has another rule, and every group reserves 384 px even when it contains only a few values.

The implementation must remain fully localized and browser-only, preserve the 20,000 Employee
target, and keep existing state, import, export, sorting, drill-down, and virtualization contracts.

## Goals / Non-Goals

**Goals:**

- Suppress only successful replacement-import filename notices.
- Show total and filtered Employee counts without computing new indexes.
- Make Analytics visually continuous, content-sized for short groups, and internally scrollable for
  long groups.
- Cover both locales and update every deterministic screenshot affected by notice removal.

**Non-Goals:**

- Change import validation, candidate construction, workspace schemas, or persisted UI state.
- Remove errors, append summaries, download feedback, Analytics sorting, or drill-down borders.
- Replace semantic tables or add a charting/runtime dependency.

## Decisions

- The state-import commit callback clears the global notice for `replace` and keeps the existing
  merge notice for `append`. The obsolete opened-file catalog entry is removed from both catalogs;
  errors remain independent in the alert row.
- The populated Employees toolbar gains a compact left summary with the localized Employees title,
  total count, and an additional localized match count only while search or filters are active. It
  uses the already-derived sorted and visible arrays, so no store state or recomputation is added.
  The empty state remains the sole zero-Employee presentation.
- Each Analytics group keeps a semantic table and the current 42 px virtual row estimate. Its
  rendered height is the title area plus table header plus `min(entryCount, 8)` rows; empty groups
  receive a compact minimum body. More than eight rows scroll inside the existing virtualized
  container. This removes fixed empty space without rendering large datasets in full.
- The surface header keeps its single bottom border for parity with Calendar. Group heading borders
  and row borders are removed, while hover and focus-within use a quiet muted background. Grid gaps
  provide section separation; the existing responsive columns and duplicate-name span remain.
- Browser assertions target rendered semantics and computed borders/heights instead of Tailwind
  implementation strings. The screenshot fixture remains deterministic and English, with separate
  Russian assertions for localized counts.

## Risks / Trade-offs

- [Dynamic virtualizer containers can be too short for measurement] → Use the existing fixed row
  estimate, explicit title/header constants, and a minimum body height for empty groups.
- [A filtered count can be mistaken for the total] → Always show total first and append matches only
  when search or filters are active.
- [Removing the filename banner also changes unrelated populated screenshots] → Regenerate and
  inspect the complete gallery, not only Employees and Analytics.
- [Borderless rows can reduce scanability] → Preserve aligned table columns, muted sticky headers,
  tabular counts, and hover/focus feedback.
