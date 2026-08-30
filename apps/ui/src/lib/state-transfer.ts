import type { OrgToolsState } from "@org-tools/types";

import { LocalizedError, uiMessage } from "@/i18n/messages";
import { downloadJson, parseOrgToolsState } from "@/lib/org-file";

export const MAX_STATE_IMPORT_BYTES = 25 * 1024 * 1024;
export const STATE_EXPORT_FILE_NAME = "org-tools-state.json";

export type StateImportCandidate = {
  employeeCount: number;
  fileName: string;
  fileSizeBytes: number;
  state: OrgToolsState;
  unitCount: number;
  viewCount: number;
};

export const parseStateImportText = (
  fileName: string,
  text: string,
  fileSizeBytes = new Blob([text]).size,
): StateImportCandidate => {
  if (fileSizeBytes > MAX_STATE_IMPORT_BYTES) {
    throw new LocalizedError(
      uiMessage("The selected file is {size} MiB; the limit is {limit} MiB.", {
        limit: Math.round(MAX_STATE_IMPORT_BYTES / 1024 / 1024),
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
      employeeCount: state.organization.employees.length,
      fileName,
      fileSizeBytes,
      state,
      unitCount: state.organization.views.reduce(
        (count, view) => count + view.document.units.length,
        0,
      ),
      viewCount: state.organization.views.length,
    };
  } catch {
    throw new LocalizedError(uiMessage("Only a complete Org Tools state can be imported."));
  }
};

export const parseStateImportFile = async (file: File) => {
  try {
    return parseStateImportText(file.name, await file.text(), file.size);
  } catch (error) {
    if (error instanceof LocalizedError) throw error;
    throw new LocalizedError(uiMessage("Could not read or parse the selected file."));
  }
};

export const downloadState = (state: OrgToolsState): void => {
  downloadJson(parseOrgToolsState(structuredClone(state)), STATE_EXPORT_FILE_NAME);
};
