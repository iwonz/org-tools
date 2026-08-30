import { describe, expect, it } from "vitest";

import { createBlankOrgToolsState } from "@/lib/org-file";
import { compareStateStamps, nextStateStamp, parseStateChannelMessage } from "@/lib/state-channel";

describe("state channel", () => {
  it("orders concurrent stamps deterministically and advances logical time", () => {
    const first = { counter: 4, originId: "a" };
    const second = { counter: 4, originId: "b" };
    expect(compareStateStamps(first, second)).toBeLessThan(0);
    expect(nextStateStamp(second, "a")).toEqual({ counter: 5, originId: "a" });
  });

  it("strictly validates handshake, state, and bounded UI messages", () => {
    const state = createBlankOrgToolsState();
    expect(parseStateChannelMessage({ originId: "tab-a", type: "request" })).toEqual({
      originId: "tab-a",
      type: "request",
    });
    expect(
      parseStateChannelMessage({
        stamp: { counter: 2, originId: "tab-a" },
        state,
        type: "state",
      }),
    ).toMatchObject({ state, type: "state" });
    expect(() =>
      parseStateChannelMessage({
        extra: true,
        stamp: { counter: 2, originId: "tab-a" },
        type: "ui",
        ui: state.ui,
      }),
    ).toThrow("shape is invalid");
  });
});
