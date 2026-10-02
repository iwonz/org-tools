## Context

The comparator and canonical requirement distinguish ordinary small-delta antialiasing from pixels
inside declared raster-noise regions. An older guide sentence described only the scoped category.

## Goals / Non-Goals

**Goals:**

- Make the validation guide match the existing implementation and normative requirement.

**Non-Goals:**

- Do not change comparator logic, limits, tests, screenshots, runtime behavior, or CI selection.

## Decisions

Replace the stale sentence with the two-category rule and retain the surrounding operational detail.
The delta repeats the current requirement so review can prove that the documentation edit introduces
no new behavior.

## Risks / Trade-offs

There is no runtime risk. The only risk is future wording drift, mitigated by linking the guide's
language directly to the canonical requirement.
