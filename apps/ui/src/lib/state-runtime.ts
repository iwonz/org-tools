import type { OrgToolsState } from "@org-tools/types";

export type StateApiErrorCode =
  | "corrupt_stored_state"
  | "database_unavailable"
  | "invalid_input"
  | "invalid_state";

export type StateApiError = {
  error: {
    code: StateApiErrorCode;
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
