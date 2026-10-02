## Context

The gallery helper currently waits 1.5 seconds before every capture, disables animations, waits for fonts, and then takes one screenshot. That sleep contributes about 84 seconds to each 56-frame pass, yet CI still observed one substantive `demo-teams.png` difference between unchanged passes. The immediate rerun passed, confirming an intermittent render-readiness race rather than an intended visual change.

The gallery runs against an isolated same-origin production runtime. Assets are bundled fonts and embedded data URLs, so readiness can be observed locally without adding network access.

## Goals / Non-Goals

**Goals:**

- Accept a screenshot only after its resources are decoded and two consecutive visual samples agree.
- Keep the existing explicit raster-noise policy and the authoritative full-gallery SHA-256 comparison.
- Bound stabilization attempts and preserve actionable failure evidence.
- Reduce gallery wall time by removing fixed waits that outlive actual readiness.

**Non-Goals:**

- Reducing the 56-frame scenario set or the two complete passes.
- Loosening pixel equality, masking product changes, or accepting unstable output.
- Changing product rendering, runtime data, persistence, localization, or dependencies.

## Decisions

1. **Observe resource readiness before sampling.** `stabilizeForScreenshot` waits for `document.fonts.ready`, calls `decode()` for every current image while tolerating an image's explicit error state, and crosses two animation frames after installing the animation-disabling stylesheet. This covers the embedded avatar race that a time delay could miss.

2. **Require consecutive visual agreement.** Capture takes bounded samples separated by a short interval. A sample is accepted only when it matches the previous sample under the same pixel comparator already used for explicit raster-noise regions. This detects asynchronous React/layout changes without relying on DOM dimensions or an arbitrary sleep.

3. **Keep tolerance bounded.** The existing comparator permits at most 256 changed pixels with channel deltas up to three. Larger deltas are accepted only inside `[data-screenshot-raster-noise]`. Resource readiness does not broaden that policy.

4. **Fail with evidence.** If no consecutive pair stabilizes within the attempt budget, the helper writes the final two samples to ignored test output and throws with the scenario ID. The CI gallery artifact step runs on failure so diagnosis does not require reproducing a rare race.

5. **Retain full end-to-end proof.** `screenshots:verify` still creates both complete gallery passes and compares all 56 SHA-256 hashes. The optimization removes idle waiting; it does not select fewer screenshots.

6. **Order database-backed visual collections.** Administration grant aggregates use explicit permission/scope ordering. PostgreSQL row order is otherwise undefined and produced visibly different role chips between clean instances even though the effective grant set was identical.

## Risks / Trade-offs

- **Persistent animated or time-varying content could exhaust the sample budget.** → Animations and carets remain disabled, clocks are fixed by fixtures, and failure exposes both samples rather than silently accepting output.
- **Taking at least two screenshots adds raster work.** → The additional capture is substantially shorter than the removed 1.5-second wait and directly proves stability.
- **Image decode can reject for an intentionally broken source.** → Rejections are tolerated after the browser reaches its completed error state; application diagnostics and expected placeholders remain authoritative.
- **CI timing varies by runner load.** → Documentation reports observed wall time and separates runner queue/load from the validation contract.
