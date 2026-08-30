import type { OrgToolsState } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import {
  BrowserWorkspaceFileConflictError,
  type BrowserWorkspaceFileHandle,
  parseBrowserWorkspaceFile,
  supportsBrowserFileAccess,
  writeBrowserWorkspaceHandle,
} from "@/lib/browser-workspace-file";
import { createBlankOrgToolsState } from "@/lib/org-file";

const createHandle = (initial: OrgToolsState) => {
  let content = JSON.stringify(initial);
  let lastModified = 1;
  let closeCount = 0;
  const handle: BrowserWorkspaceFileHandle = {
    createWritable: async () => ({
      close: async () => {
        closeCount += 1;
        lastModified += 1;
      },
      write: async (value) => {
        content = value;
      },
    }),
    getFile: async () => new File([content], "workspace.json", { lastModified }),
    name: "workspace.json",
  };
  return {
    closeCount: () => closeCount,
    content: () => content,
    externallyChange: () => {
      lastModified += 10;
    },
    handle,
  };
};

describe("browser workspace file lifecycle", () => {
  test("opens only strict full workspace documents", async () => {
    const state = createBlankOrgToolsState();
    await expect(
      parseBrowserWorkspaceFile(new File([JSON.stringify(state)], "workspace.json")),
    ).resolves.toEqual(state);
    await expect(
      parseBrowserWorkspaceFile(
        new File([JSON.stringify({ ...state, content: "employees" })], "employees.json"),
      ),
    ).rejects.toThrow("full workspace");
    await expect(parseBrowserWorkspaceFile(new File(["{"], "broken.json"))).rejects.toThrow();
  });

  test("finishes write and close before reporting a new fingerprint", async () => {
    const state = createBlankOrgToolsState();
    const fake = createHandle(state);
    const before = await fake.handle.getFile();
    const fingerprint = await writeBrowserWorkspaceHandle({
      expectedFingerprint: { lastModified: before.lastModified, size: before.size },
      handle: fake.handle,
      state,
    });
    expect(fake.closeCount()).toBe(1);
    expect(JSON.parse(fake.content())).toEqual(state);
    expect(fingerprint.lastModified).toBeGreaterThan(before.lastModified);
  });

  test("detects external file changes and supports an explicit overwrite", async () => {
    const state = createBlankOrgToolsState();
    const fake = createHandle(state);
    const before = await fake.handle.getFile();
    const expectedFingerprint = { lastModified: before.lastModified, size: before.size };
    fake.externallyChange();
    await expect(
      writeBrowserWorkspaceHandle({ expectedFingerprint, handle: fake.handle, state }),
    ).rejects.toBeInstanceOf(BrowserWorkspaceFileConflictError);
    await expect(
      writeBrowserWorkspaceHandle({ expectedFingerprint, force: true, handle: fake.handle, state }),
    ).resolves.toBeDefined();
  });

  test("requires both native pickers", () => {
    expect(supportsBrowserFileAccess({} as Window)).toBe(false);
    expect(
      supportsBrowserFileAccess({
        showOpenFilePicker: async () => [],
        showSaveFilePicker: async () => createHandle(createBlankOrgToolsState()).handle,
      } as unknown as Window),
    ).toBe(true);
  });
});
