import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveMigrationsDirectory } from "@/server/schema-readiness";

describe("schema readiness paths", () => {
  it("resolves migrations from the repository, app workspace, and standalone image roots", () => {
    expect(resolveMigrationsDirectory("/workspace")).toBe(resolve("/workspace/apps/ui/migrations"));
    expect(resolveMigrationsDirectory("/workspace/apps/ui")).toBe(
      resolve("/workspace/apps/ui/migrations"),
    );
    expect(resolveMigrationsDirectory("/app")).toBe(resolve("/app/apps/ui/migrations"));
  });
});
