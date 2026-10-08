import { describe, expect, it } from "vitest";

import { createBrowserSuiteBatches } from "../packages/screenshots/scripts/browser-suite-plan.mjs";

const suites = ["auth.spec.ts", "editor.spec.ts", "state.spec.ts"];

describe("browser suite batching", () => {
  it("keeps unfiltered suites isolated", () => {
    expect(createBrowserSuiteBatches(suites, [])).toEqual([
      ["auth.spec.ts"],
      ["editor.spec.ts"],
      ["state.spec.ts"],
    ]);
  });

  it.each([["--grep", "@access"], ["--grep=@access"], ["--shard=1/4"]])(
    "combines suites when filtering with %s",
    (...arguments_) => {
      expect(createBrowserSuiteBatches(suites, arguments_)).toEqual([suites]);
    },
  );
});
