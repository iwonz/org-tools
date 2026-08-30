import { describe, expect, test, vi } from "vitest";

import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_STORAGE_KEY,
  persistAutosavePreference,
  readAutosavePreference,
} from "@/lib/autosave-preference";

describe("autosave preference", () => {
  test("defaults to disabled and uses the stable metadata key", () => {
    const storage = { getItem: vi.fn(() => null) };
    expect(readAutosavePreference(storage)).toBe(false);
    expect(storage.getItem).toHaveBeenCalledWith(AUTOSAVE_STORAGE_KEY);
    expect(AUTOSAVE_DEBOUNCE_MS).toBe(1_000);
  });

  test("persists only a boolean preference", () => {
    const storage = { setItem: vi.fn() };
    expect(persistAutosavePreference(true, storage)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(AUTOSAVE_STORAGE_KEY, "true");
    expect(persistAutosavePreference(false, storage)).toBe(true);
    expect(storage.setItem).toHaveBeenLastCalledWith(AUTOSAVE_STORAGE_KEY, "false");
  });

  test("fails closed when browser storage is unavailable", () => {
    expect(
      readAutosavePreference({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toBe(false);
    expect(
      persistAutosavePreference(true, {
        setItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toBe(false);
  });
});
