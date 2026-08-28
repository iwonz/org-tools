## Context

The repository already commits 16 deterministic English screenshots generated from obviously
synthetic fixtures. `README.md` currently gives a long feature and contributor overview, while the
visual gallery is one link away in `docs/screenshots.md`. Repository hosts sanitize README HTML and
do not allow custom JavaScript, so an embedded lightbox implementation is neither portable nor
appropriate.

## Goals / Non-Goals

**Goals:**

- Make the first README screen explain the product in a few lines.
- Show a compact set of representative product surfaces without adding new screenshot fixtures.
- Make every preview a link to its original PNG so the repository host can open the full-size image
  in its native image viewer.
- Give a copyable local-start path and keep deeper documentation discoverable.

**Non-Goals:**

- Changing the application UI, fixtures, state model, browser storage, requests, or exports.
- Shipping a custom README script, lightbox dependency, video, animated media, or remote image.
- Repeating contributor validation details already documented in `CONTRIBUTING.md` and `docs/`.

## Decisions

### Use linked local PNG previews

The README will wrap each local `<img>` in an `<a>` pointing to the same full-resolution PNG. This
preserves repository portability, makes the intent explicit in rendered Markdown, and delegates
expanded viewing to the hosting platform. A JavaScript modal was rejected because README renderers
strip scripts and because it would add a network or dependency surface for documentation only.

### Curate the gallery

The gallery will show the primary populated workflows—Editor, Employees, Analytics, Calendar,
Download, and import mapping—in a two-column HTML table. These images communicate more product value
than setup dialogs and edge-case captures, while `docs/screenshots.md` remains the exhaustive
gallery. The existing PNGs and synthetic fixture remain the source of truth.

### Keep setup separate and minimal

The README will end with prerequisites, one install command, one development command, and the local
URL. Detailed testing, architecture, privacy, and contribution guidance will remain links so the
main path stays short.

## Risks / Trade-offs

- [Repository hosts render Markdown HTML differently] -> Use basic `<table>`, `<a>`, and `<img>`
  elements with relative paths and meaningful alt text.
- [A host opens the PNG on a page instead of a modal] -> Keep direct original-image links; expanded
  viewing still works without relying on unsupported custom behavior.
- [Screenshots become stale after UI changes] -> Continue generating them through the existing
  deterministic Playwright command and document the exhaustive gallery separately.
- [Large images increase README transfer size] -> Reuse six existing PNGs and constrain their
  rendered width; do not duplicate or encode image files.
