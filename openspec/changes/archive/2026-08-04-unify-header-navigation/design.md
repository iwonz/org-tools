## Context

The shell currently renders a 56 px wordmark/action header followed by a second 56 px product-tab
row. The locale trigger also repeats the selected language name even though its menu already exposes
the complete localized options. The change removes this duplication without altering any workspace
or transfer behavior.

## Goals / Non-Goals

**Goals:**

- Render one 56 px header with the six tabs on the left and all global controls on the right.
- Preserve tab order, keyboard behavior, active-tab persistence, and file-action behavior.
- Keep the header contained from 390 px through the maintained desktop viewports.
- Make locale and transfer controls visually compact while retaining complete accessible names.

**Non-Goals:**

- Renaming internal `orgEditor` identifiers or descriptive organization-editor terminology.
- Changing product metadata, public state, filenames, import parsing, or export serialization.
- Adding alternate mobile navigation, remote assets, dependencies, or network behavior.

## Decisions

1. The Radix Tabs root will own the entire application column so its TabsList can render inside the
   application header. The header remains a single 56 px flex row; status bands and active content
   follow it within the same root.
2. A `min-w-0` navigation region will own horizontal overflow while the right action group remains
   `shrink-0`. Focused tabs rely on native overflow focus scrolling, preserving Radix keyboard
   navigation and avoiding a second mobile navigation model.
3. Import and Export retain visible labels at `lg` and wider. Below 1024 px the label spans are
   hidden and both buttons retain explicit localized `aria-label` and `title` values.
4. Import uses `HiOutlineDocumentArrowUp` and Export uses
   `HiOutlineDocumentArrowDown`, producing one symmetric local icon family with no new dependency.
5. The locale trigger becomes the same square size as the theme trigger and renders only its
   decorative active flag. Its accessible name and title still include the localized control name
   and active language; menu rows retain flag, language name, and check indicator.
6. A dedicated `Editor` translation key supplies the short navigation label. Existing `Org Editor`
   keys remain for contextual and accessibility copy, while `activeTab: "orgEditor"` remains stable.

## Risks / Trade-offs

- [A six-tab strip cannot fully fit beside four actions at narrow widths] -> Confine overflow to the
  tab region, hide transfer labels below 1024 px, and test 390, 1024, and 1280 px widths.
- [Removing the visible wordmark reduces in-app branding] -> Preserve Org Tools in document metadata,
  exported contracts, and documentation as explicitly required.
- [Icon-only actions can become ambiguous] -> Keep localized accessible names and browser tooltips in
  every responsive state.
- [Moving the TabsList could affect focus order] -> Preserve DOM order as tabs followed by locale,
  theme, Import, and Export, and verify arrow-key and Tab navigation in browser tests.
