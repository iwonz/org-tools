import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("release publication workflows", () => {
  it("dispatches the existing container publisher for the exact released tag", async () => {
    const [containerSource, releaseSource] = await Promise.all([
      readFile(".github/workflows/container.yml", "utf8"),
      readFile(".github/workflows/release.yml", "utf8"),
    ]);

    expect(containerSource).toMatch(/on:\n {2}workflow_dispatch:\n {2}push:/u);
    expect(containerSource).toContain('tags: ["v*.*.*"]');

    expect(releaseSource).toContain("  actions: write");
    expect(releaseSource).toContain("  contents: write");
    expect(releaseSource).toContain("  pull-requests: write");
    expect(releaseSource).toMatch(
      /if: \$\{\{ steps\.release\.outputs\.release_created == 'true' \}\}/u,
    );
    expect(releaseSource).toMatch(/RELEASE_TAG: \$\{\{ steps\.release\.outputs\.tag_name \}\}/u);
    expect(releaseSource).toMatch(/gh workflow run container\.yml --ref "\$\{RELEASE_TAG\}"/u);
    expect(releaseSource).not.toMatch(/personal access token|RELEASE_PLEASE_TOKEN|PAT_TOKEN/iu);
  });
});
