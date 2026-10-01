import { describe, expect, it } from "vitest";

import { ALL_BROWSER_SUITES, createValidationPlan } from "./validation-plan.mjs";

describe("validation impact planner", () => {
  it("keeps documentation-only feedback fast", () => {
    const plan = createValidationPlan(["docs/usage.md", "openspec/specs/project-tooling/spec.md"]);
    expect(plan).toMatchObject({
      browserSuites: [],
      build: false,
      fullFallback: false,
      image: false,
      runtime: false,
      screenshots: false,
    });
  });

  it("selects localized visual feedback", () => {
    const plan = createValidationPlan(["apps/ui/messages/ru.json"]);
    expect(plan.browserSuites).toEqual(["tests/smoke.spec.ts", "tests/localization.spec.ts"]);
    expect(plan).toMatchObject({ build: true, runtime: true, screenshots: true });
  });

  it("selects authorization and state coverage for server changes", () => {
    const plan = createValidationPlan(["apps/ui/src/server/authorized-projection.ts"]);
    expect(plan.browserSuites).toEqual(["tests/auth-access.spec.ts", "tests/state.spec.ts"]);
    expect(plan).toMatchObject({ build: true, image: true, runtime: true });
  });

  it("keeps full unit coverage for an isolated unit-test change", () => {
    const plan = createValidationPlan(["apps/ui/src/lib/tag-order.test.ts"]);
    expect(plan.browserSuites).toEqual([]);
    expect(plan.fastGates).toContain("unit");
    expect(plan.runtime).toBe(false);
  });

  it("selects maintained visual evidence for UI components", () => {
    const plan = createValidationPlan(["apps/ui/src/components/org-tools-shell.tsx"]);
    expect(plan.browserSuites).toEqual(["tests/smoke.spec.ts"]);
    expect(plan.screenshots).toBe(true);
  });

  it("selects the complete plan for validation infrastructure", () => {
    const plan = createValidationPlan([".github/workflows/ci.yml"]);
    expect(plan.browserSuites).toEqual(ALL_BROWSER_SUITES);
    expect(plan).toMatchObject({
      build: true,
      fullFallback: true,
      image: true,
      runtime: true,
      screenshots: true,
    });
  });

  it("selects the complete plan for unknown paths", () => {
    const plan = createValidationPlan(["new-area/contract.data"]);
    expect(plan.browserSuites).toEqual(ALL_BROWSER_SUITES);
    expect(plan.fullFallback).toBe(true);
  });

  it("selects the complete plan when the comparison base is unavailable", () => {
    const plan = createValidationPlan([], { baseAvailable: false });
    expect(plan.browserSuites).toEqual(ALL_BROWSER_SUITES);
    expect(plan.fullFallback).toBe(true);
    expect(plan.reasons).toContain("comparison base is unavailable; using the complete plan");
  });
});
