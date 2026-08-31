import type { OrgToolsState } from "@org-tools/types";

export type StateApiErrorCode =
  | "corrupt_stored_state"
  | "database_unavailable"
  | "invalid_input"
  | "invalid_state"
  | "revision_conflict";

export type StateApiError = {
  error: {
    code: StateApiErrorCode;
    currentRevision?: number;
  };
};

export type StateDocument = {
  revision: number;
  state: OrgToolsState;
};

export type StatePutRequest =
  | { organization: OrgToolsState["organization"]; scope: "organization" }
  | { scope: "ui"; ui: OrgToolsState["ui"] }
  | { scope: "all"; state: OrgToolsState };

export type StatePutApiRequest = StatePutRequest & { expectedRevision: number };
