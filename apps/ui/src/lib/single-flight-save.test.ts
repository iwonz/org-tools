import { describe, expect, test, vi } from "vitest";

import { runSingleFlightSave, type SingleFlightSaveState } from "@/lib/single-flight-save";

describe("single-flight Save", () => {
  test("shares one active write and accepts a later flush", async () => {
    let finish: ((value: boolean) => void) | undefined;
    const operation = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          finish = resolve;
        }),
    );
    const state: SingleFlightSaveState = { current: null };
    const first = runSingleFlightSave(state, operation);
    const second = runSingleFlightSave(state, operation);
    await vi.waitFor(() => expect(operation).toHaveBeenCalledTimes(1));
    finish?.(true);
    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);

    await expect(runSingleFlightSave(state, async () => false)).resolves.toBe(false);
  });
});
