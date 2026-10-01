import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("development check wrapper", () => {
  it("bounds failed readiness polling and emits app diagnostics", async () => {
    const directory = await mkdtemp(join(tmpdir(), "org-tools-dev-check-"));
    try {
      const dockerPath = join(directory, "docker");
      const sleepPath = join(directory, "sleep");
      await writeFile(
        dockerPath,
        `#!/bin/sh
case "$*" in
  *"ps --status running --services app"*) echo app ;;
  *"exec -T app node -e"*) exit 1 ;;
  *"ps app"*) echo "APP STATUS MARKER" ;;
  *"logs --no-color --tail 200 app"*) echo "APP LOG MARKER" ;;
  *) echo "Unexpected docker invocation: $*" >&2; exit 2 ;;
esac
`,
        { mode: 0o700 },
      );
      await writeFile(sleepPath, "#!/bin/sh\nexit 0\n", { mode: 0o700 });

      const result = spawnSync("./bin/org-tools-dev-check", {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, PATH: `${directory}:${process.env.PATH ?? ""}` },
        timeout: 5_000,
      });

      expect(result.status).toBe(1);
      expect(result.signal).toBeNull();
      expect(result.stderr).toContain(
        "Development application did not become ready within the bounded polling window.",
      );
      expect(result.stderr).toContain("APP STATUS MARKER");
      expect(result.stderr).toContain("APP LOG MARKER");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
