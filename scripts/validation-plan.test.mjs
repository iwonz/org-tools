import { describe, expect, it } from "vitest";

import {
  ALL_BROWSER_TAGS,
  ALL_SCREENSHOT_MODULES,
  createFullValidationPlan,
  createValidationPlan,
  FAST_GATES,
} from "./validation-plan.mjs";

describe("validation impact planner", () => {
  it("defines a non-networked Fast profile", () => {
    expect(FAST_GATES).toEqual([
      "lint",
      "typecheck",
      "unit",
      "architecture",
      "dead-source-and-dependencies",
      "spec",
      "diff",
      "source-publication",
    ]);
  });

  it("defines an exhaustive explicit Full profile", () => {
    expect(createFullValidationPlan()).toMatchObject({
      audit: true,
      browserTags: ALL_BROWSER_TAGS,
      build: true,
      full: true,
      image: true,
      migrations: true,
      runtime: true,
      screenshotAll: true,
      screenshotModules: ALL_SCREENSHOT_MODULES,
    });
  });
  it("keeps documentation-only feedback fast and offline", () => {
    const plan = createValidationPlan(["docs/usage.md", "openspec/specs/project-tooling/spec.md"]);
    expect(plan).toMatchObject({
      audit: false,
      browserTags: [],
      build: false,
      full: false,
      image: false,
      migrations: false,
      runtime: false,
      screenshots: false,
    });
    expect(plan.fastGates).toContain("architecture");
    expect(plan.fastGates).not.toContain("dependency-security-audit");
    expect(plan.fastGates).not.toContain("browser-shard-partition");
  });

  it("selects all localized visual feedback once", () => {
    const plan = createValidationPlan(["apps/ui/messages/ru.json"]);
    expect(plan.browserTags).toEqual(["@core", "@localization"]);
    expect(plan).toMatchObject({ build: true, runtime: true, screenshotAll: true });
  });

  it("selects authorization and state coverage for server changes", () => {
    const plan = createValidationPlan(["apps/ui/src/server/authorized-projection.ts"]);
    expect(plan.browserTags).toEqual(["@access", "@state"]);
    expect(plan).toMatchObject({ build: true, full: false, image: false, runtime: true });
  });

  it("selects migration and restart evidence only for persistence inputs", () => {
    const plan = createValidationPlan(["apps/ui/migrations/0005_example.sql"]);
    expect(plan).toMatchObject({ build: true, migrations: true, runtime: true });
    expect(plan.browserTags).toEqual(["@access", "@state"]);
  });

  it("keeps complete unit and architecture coverage for a unit-test change", () => {
    const plan = createValidationPlan(["apps/ui/src/lib/tag-order.test.ts"]);
    expect(plan.browserTags).toEqual([]);
    expect(plan.fastGates).toEqual(
      expect.arrayContaining(["unit", "architecture", "dead-source-and-dependencies"]),
    );
    expect(plan.runtime).toBe(false);
  });

  it("selects owned Employee browser and screenshot domains", () => {
    const plan = createValidationPlan(["apps/ui/src/components/employee-dialog.tsx"]);
    expect(plan.browserTags).toEqual(["@core", "@employees"]);
    expect(plan.screenshotModules).toEqual(["employees"]);
    expect(plan.screenshotAll).toBe(false);
  });

  it("selects a complete one-pass gallery for shared visual primitives", () => {
    const plan = createValidationPlan(["apps/ui/src/components/ui/dialog.tsx"]);
    expect(plan.screenshotAll).toBe(true);
    expect(plan.full).toBe(false);
  });

  it("selects dependency audit and image inspection for delivery inputs", () => {
    const plan = createValidationPlan(["Dockerfile", "pnpm-lock.yaml"]);
    expect(plan).toMatchObject({ audit: true, build: true, image: true });
  });

  it("selects structural large-Editor evidence without escalating to Full", () => {
    const plan = createValidationPlan([
      "packages/screenshots/tests/editor-performance-workflow.ts",
    ]);
    expect(plan.browserTags).toEqual(["@performance"]);
    expect(plan).toMatchObject({ build: true, full: false, runtime: true });
  });

  it("selects Full Regression only when evidence infrastructure changes", () => {
    const plan = createValidationPlan([".github/workflows/ci.yml"]);
    expect(plan.browserTags).toEqual(ALL_BROWSER_TAGS);
    expect(plan).toMatchObject({
      audit: true,
      build: true,
      full: true,
      image: true,
      migrations: true,
      runtime: true,
      screenshotAll: true,
    });
  });

  it("uses every Core domain rather than Full for unknown paths", () => {
    const plan = createValidationPlan(["new-area/contract.data"]);
    expect(plan.browserTags).toEqual(ALL_BROWSER_TAGS);
    expect(plan.full).toBe(false);
    expect(plan.screenshotAll).toBe(false);
  });

  it("uses every Core domain when the comparison base is unavailable", () => {
    const plan = createValidationPlan([], { baseAvailable: false });
    expect(plan.browserTags).toEqual(ALL_BROWSER_TAGS);
    expect(plan.full).toBe(false);
    expect(plan.reasons).toContain("comparison base is unavailable; using every Core domain");
  });
});
