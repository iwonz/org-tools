import "fake-indexeddb/auto";

import { beforeEach, describe, expect, test } from "vitest";

import {
  clearStoredBrowserFileHandle,
  readStoredBrowserFileHandle,
  storeBrowserFileHandle,
} from "@/lib/browser-file-handle-store";
import type { BrowserWorkspaceFileHandle } from "@/lib/browser-workspace-file";

describe("browser file handle metadata", () => {
  beforeEach(async () => {
    await clearStoredBrowserFileHandle();
  });

  test("stores only the active handle under the stable entry", async () => {
    const handle = { name: "workspace.json" } as BrowserWorkspaceFileHandle;
    expect(await storeBrowserFileHandle(handle)).toBe(true);
    expect(await readStoredBrowserFileHandle()).toEqual(handle);
    expect(await clearStoredBrowserFileHandle()).toBe(true);
    expect(await readStoredBrowserFileHandle()).toBeNull();
  });
});
