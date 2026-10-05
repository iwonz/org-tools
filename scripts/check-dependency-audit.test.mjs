import { describe, expect, it } from "vitest";

import { classifyDependencyAudit } from "./check-dependency-audit.mjs";

const advisory = {
  findings: [
    {
      dev: true,
      paths: [".>@fission-ai/openspec>fast-glob>micromatch>braces"],
      version: "3.0.3",
    },
  ],
  github_advisory_id: "GHSA-vfj7-8cjw-p6xm",
  id: 1240992,
  module_name: "braces",
  patched_versions: null,
  patched_versions_unpublished: true,
  severity: "high",
};

describe("dependency audit exception", () => {
  it("accepts only the exact unpatched OpenSpec development path before review", () => {
    expect(
      classifyDependencyAudit(
        { advisories: { 1240992: advisory } },
        new Date("2026-10-05T00:00:00.000Z"),
      ),
    ).toEqual({ accepted: [advisory], blocking: [] });
  });

  it("blocks production paths, patched advisories, and expired reviews", () => {
    for (const candidate of [
      { ...advisory, findings: [{ ...advisory.findings[0], dev: false }] },
      { ...advisory, patched_versions: ">=3.0.4", patched_versions_unpublished: false },
    ]) {
      expect(
        classifyDependencyAudit(
          { advisories: { 1240992: candidate } },
          new Date("2026-10-05T00:00:00.000Z"),
        ).blocking,
      ).toEqual([candidate]);
    }
    expect(
      classifyDependencyAudit(
        { advisories: { 1240992: advisory } },
        new Date("2026-11-05T00:00:00.000Z"),
      ).blocking,
    ).toEqual([advisory]);
  });
});
