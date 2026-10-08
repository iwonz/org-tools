import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const browserFiles = [
  "packages/screenshots/tests/auth-access.spec.ts",
  "packages/screenshots/tests/localization.spec.ts",
  "packages/screenshots/tests/smoke.spec.ts",
  "packages/screenshots/tests/state.spec.ts",
];

const declaredTitles = browserFiles.flatMap((path) => {
  const source = readFileSync(path, "utf8");
  return [...source.matchAll(/\btest\(\s*[`"]([^`"]+)/gu)].map((match) => match[1]);
});

describe("browser evidence classification", () => {
  it("assigns every maintained browser scenario to Full Regression", () => {
    const unclassified = declaredTitles.filter((title) => !title.includes("@regression"));
    expect(unclassified).toEqual([]);
  });

  it("keeps the Core suite intentionally small", () => {
    const coreTitles = declaredTitles.filter((title) => title.includes("@core"));
    expect(coreTitles.length).toBeGreaterThanOrEqual(6);
    expect(coreTitles.length).toBeLessThanOrEqual(10);
  });

  it("keeps performance out of Core and in Full Regression", () => {
    const performanceTitles = declaredTitles.filter((title) => title.includes("@performance"));
    expect(performanceTitles).toHaveLength(1);
    expect(performanceTitles[0]).toContain("@regression");
    expect(performanceTitles[0]).not.toContain("@core");
  });
});
