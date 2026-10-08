import { describe, expect, it } from "vitest";

import {
  architectureZone,
  findArchitectureCycles,
  validateArchitectureEdges,
} from "./check-architecture.mjs";

describe("architecture import graph", () => {
  it("classifies production layers", () => {
    expect(architectureZone("packages/types/index.ts")).toBe("types");
    expect(architectureZone("apps/ui/src/app/api/session/route.ts")).toBe("api");
    expect(architectureZone("apps/ui/src/components/button.tsx")).toBe("components");
  });

  it("accepts forward dependencies and rejects reverse or sibling layers", () => {
    expect(
      validateArchitectureEdges([
        { from: "apps/ui/src/components/card.tsx", to: "apps/ui/src/stores/org-store.ts" },
        { from: "apps/ui/src/server/service.ts", to: "apps/ui/src/lib/data.ts" },
        { from: "apps/ui/src/app/api/session/route.ts", to: "apps/ui/src/server/session.ts" },
      ]),
    ).toEqual([]);
    expect(
      validateArchitectureEdges([
        { from: "apps/ui/src/lib/data.ts", to: "apps/ui/src/stores/org-store.ts" },
        { from: "apps/ui/src/stores/org-store.ts", to: "apps/ui/src/server/service.ts" },
        { from: "apps/ui/src/components/card.tsx", to: "apps/ui/src/server/service.ts" },
      ]),
    ).toHaveLength(3);
  });

  it("reports complete direct and transitive cycles", () => {
    const files = ["apps/ui/src/lib/a.ts", "apps/ui/src/lib/b.ts", "apps/ui/src/lib/c.ts"];
    expect(
      findArchitectureCycles(files, [
        { from: files[0], to: files[1] },
        { from: files[1], to: files[2] },
        { from: files[2], to: files[0] },
      ]),
    ).toEqual([[files[0], files[1], files[2], files[0]]]);
  });
});
