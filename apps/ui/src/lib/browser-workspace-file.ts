import type { OrgToolsState } from "@org-tools/types";

import { downloadJson, parseOrgToolsState } from "@/lib/org-file";
import { MAX_EMPLOYEE_IMPORT_FILE_BYTES } from "@/stores/import-session-store";

export type BrowserFileFingerprint = {
  lastModified: number;
  size: number;
};

export type BrowserWritable = {
  close: () => Promise<void>;
  write: (data: string) => Promise<void>;
};

export type BrowserWorkspaceFileHandle = {
  createWritable: () => Promise<BrowserWritable>;
  getFile: () => Promise<File>;
  name: string;
  queryPermission?: (options?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (options?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
};

export class BrowserWorkspaceFileConflictError extends Error {
  constructor() {
    super("The workspace file changed outside Org Tools.");
    this.name = "BrowserWorkspaceFileConflictError";
  }
}

export const browserFileFingerprint = (file: Pick<File, "lastModified" | "size">) => ({
  lastModified: file.lastModified,
  size: file.size,
});

export const browserFileFingerprintsEqual = (
  first: BrowserFileFingerprint | null,
  second: BrowserFileFingerprint,
) => first !== null && first.lastModified === second.lastModified && first.size === second.size;

export const parseBrowserWorkspaceFile = async (
  file: Pick<File, "name" | "size" | "text">,
): Promise<OrgToolsState> => {
  if (file.size > MAX_EMPLOYEE_IMPORT_FILE_BYTES) {
    throw new Error("Workspace file exceeds the 25 MiB limit.");
  }
  const parsed = parseOrgToolsState(JSON.parse(await file.text()) as unknown);
  if (parsed.content !== "workspace") {
    throw new Error("Open workspace requires a full workspace state.");
  }
  return parsed;
};

export const readBrowserWorkspaceHandle = async (handle: BrowserWorkspaceFileHandle) => {
  const file = await handle.getFile();
  return {
    fingerprint: browserFileFingerprint(file),
    state: await parseBrowserWorkspaceFile(file),
  };
};

export const writeBrowserWorkspaceHandle = async ({
  expectedFingerprint,
  force,
  handle,
  state,
}: {
  expectedFingerprint: BrowserFileFingerprint | null;
  force?: boolean;
  handle: BrowserWorkspaceFileHandle;
  state: OrgToolsState;
}) => {
  const parsed = parseOrgToolsState(structuredClone(state));
  if (parsed.content !== "workspace") throw new Error("Only a full workspace can be saved.");
  const current = browserFileFingerprint(await handle.getFile());
  if (
    !force &&
    expectedFingerprint &&
    !browserFileFingerprintsEqual(expectedFingerprint, current)
  ) {
    throw new BrowserWorkspaceFileConflictError();
  }
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(parsed));
  await writable.close();
  return browserFileFingerprint(await handle.getFile());
};

export const downloadBrowserWorkspace = (state: OrgToolsState) => {
  const parsed = parseOrgToolsState(structuredClone(state));
  if (parsed.content !== "workspace") throw new Error("Only a full workspace can be saved.");
  downloadJson(parsed, "org-tools-state.json");
};

type FilePickerWindow = Window & {
  showOpenFilePicker?: (options?: unknown) => Promise<BrowserWorkspaceFileHandle[]>;
  showSaveFilePicker?: (options?: unknown) => Promise<BrowserWorkspaceFileHandle>;
};

export const supportsBrowserFileAccess = (value: Window = window) => {
  const pickerWindow = value as FilePickerWindow;
  return (
    typeof pickerWindow.showOpenFilePicker === "function" &&
    typeof pickerWindow.showSaveFilePicker === "function"
  );
};

const pickerOptions = {
  excludeAcceptAllOption: true,
  types: [
    {
      accept: { "application/json": [".json"] },
      description: "Org Tools workspace",
    },
  ],
};

export const showBrowserWorkspaceOpenPicker = async () => {
  const pickerWindow = window as FilePickerWindow;
  if (!pickerWindow.showOpenFilePicker) throw new Error("File System Access is unavailable.");
  const [handle] = await pickerWindow.showOpenFilePicker({ ...pickerOptions, multiple: false });
  if (!handle) throw new DOMException("File selection was cancelled.", "AbortError");
  return handle;
};

export const showBrowserWorkspaceSavePicker = async () => {
  const pickerWindow = window as FilePickerWindow;
  if (!pickerWindow.showSaveFilePicker) throw new Error("File System Access is unavailable.");
  return pickerWindow.showSaveFilePicker({
    ...pickerOptions,
    suggestedName: "org-tools-state.json",
  });
};

export const isPickerCancellation = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";
