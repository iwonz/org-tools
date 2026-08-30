import type { OrgToolsState } from "@org-tools/types";

import { LocalizedError, uiMessage } from "@/i18n/messages";
import { downloadJson, parseOrgToolsState } from "@/lib/org-file";

export const MAX_WORKSPACE_IMPORT_BYTES = 25 * 1024 * 1024;
export const WORKSPACE_EXPORT_FILE_NAME = "org-tools-state.json";

export type WorkspaceImportCandidate = {
  employeeCount: number;
  fileName: string;
  fileSizeBytes: number;
  state: OrgToolsState;
  unitCount: number;
  viewCount: number;
};

export const parseWorkspaceImportText = (
  fileName: string,
  text: string,
  fileSizeBytes = new Blob([text]).size,
): WorkspaceImportCandidate => {
  if (fileSizeBytes > MAX_WORKSPACE_IMPORT_BYTES) {
    throw new LocalizedError(
      uiMessage("The selected file is {size} MiB; the limit is {limit} MiB.", {
        limit: Math.round(MAX_WORKSPACE_IMPORT_BYTES / 1024 / 1024),
        size: Math.ceil(fileSizeBytes / 1024 / 1024),
      }),
    );
  }

  let input: unknown;
  try {
    input = JSON.parse(text) as unknown;
  } catch {
    throw new LocalizedError(uiMessage("Could not read or parse the selected file."));
  }

  try {
    const state = parseOrgToolsState(input);
    return {
      employeeCount: state.employees.length,
      fileName,
      fileSizeBytes,
      state,
      unitCount: state.views.reduce((count, view) => count + view.state.units.length, 0),
      viewCount: state.views.length,
    };
  } catch {
    throw new LocalizedError(uiMessage("Only a complete Org Tools workspace can be imported."));
  }
};

export const parseWorkspaceImportFile = async (file: File) => {
  try {
    return parseWorkspaceImportText(file.name, await file.text(), file.size);
  } catch (error) {
    if (error instanceof LocalizedError) throw error;
    throw new LocalizedError(uiMessage("Could not read or parse the selected file."));
  }
};

export const downloadWorkspace = (state: OrgToolsState): void => {
  downloadJson(parseOrgToolsState(structuredClone(state)), WORKSPACE_EXPORT_FILE_NAME);
};
