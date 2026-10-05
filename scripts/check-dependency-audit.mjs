#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const UNPATCHED_TOOLING_EXCEPTIONS = new Map([
  [
    "GHSA-vfj7-8cjw-p6xm",
    {
      moduleName: "braces",
      path: ".>@fission-ai/openspec>fast-glob>micromatch>braces",
      reviewAfter: "2026-11-05",
    },
  ],
]);

export const classifyDependencyAudit = (report, currentDate = new Date()) => {
  const accepted = [];
  const blocking = [];
  for (const advisory of Object.values(report.advisories ?? {})) {
    const exception = UNPATCHED_TOOLING_EXCEPTIONS.get(advisory.github_advisory_id);
    const findings = advisory.findings ?? [];
    const exceptionIsCurrent =
      exception && currentDate < new Date(`${exception.reviewAfter}T00:00:00.000Z`);
    const isExactUnpatchedToolingPath =
      exceptionIsCurrent &&
      advisory.module_name === exception.moduleName &&
      advisory.patched_versions === null &&
      advisory.patched_versions_unpublished === true &&
      findings.length > 0 &&
      findings.every(
        (finding) =>
          finding.dev === true &&
          finding.paths?.length > 0 &&
          finding.paths.every((path) => path === exception.path),
      );
    (isExactUnpatchedToolingPath ? accepted : blocking).push(advisory);
  }
  return { accepted, blocking };
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const result = spawnSync("pnpm", ["audit", "--audit-level", "moderate", "--json"], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    process.stderr.write(result.stderr);
    process.stdout.write(result.stdout);
    process.exit(result.status || 1);
  }

  const { accepted, blocking } = classifyDependencyAudit(report);
  for (const advisory of accepted) {
    console.warn(
      `Temporarily accepted unpatched dev-only advisory ${advisory.github_advisory_id} (${advisory.module_name}); review is required by 2026-11-05.`,
    );
  }
  if (blocking.length > 0) {
    process.stdout.write(
      `${JSON.stringify({ advisories: Object.fromEntries(blocking.map((item) => [item.id, item])) }, null, 2)}\n`,
    );
    process.exit(1);
  }
  if (result.status !== 0 && accepted.length === 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status || 1);
  }
  console.log("Dependency security audit passed.");
}
