"use client";

import type { ReactNode } from "react";

import { StateRuntimeController } from "@/components/state-runtime-controller";
import { parseOrgToolsState } from "@/lib/org-file";
import type {
  StateApiError,
  StateApiErrorCode,
  StateDocument,
  StatePutRequest,
} from "@/lib/state-runtime";

class StateTransportError extends Error {
  readonly code: StateApiErrorCode;

  constructor(code: StateApiErrorCode) {
    super(code);
    this.name = "StateTransportError";
    this.code = code;
  }
}

const parseDocument = (input: unknown): StateDocument => {
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input) ||
    Object.keys(input).sort().join("\0") !== ["revision", "state"].sort().join("\0") ||
    !("revision" in input) ||
    !Number.isSafeInteger(input.revision) ||
    (input.revision as number) < 1 ||
    !("state" in input)
  ) {
    throw new StateTransportError("invalid_state");
  }
  return { revision: input.revision as number, state: parseOrgToolsState(input.state) };
};

const readError = (input: unknown): { code: StateApiErrorCode } | null => {
  if (typeof input !== "object" || input === null || !("error" in input)) return null;
  try {
    const body = input as StateApiError;
    const code = body.error.code;
    if (
      code === "corrupt_stored_state" ||
      code === "database_unavailable" ||
      code === "invalid_input" ||
      code === "invalid_state"
    ) {
      return { code };
    }
  } catch {
    // Unknown server output is deliberately ignored and collapsed below.
  }
  return null;
};

const requestState = async (request?: StatePutRequest): Promise<StateDocument> => {
  const response = await fetch(
    "/api/state",
    request
      ? {
          body: JSON.stringify(request),
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          method: "PUT",
        }
      : { cache: "no-store" },
  );
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new StateTransportError("database_unavailable");
  }
  const error = readError(body);
  if (error) {
    throw new StateTransportError(error.code);
  }
  if (!response.ok) throw new StateTransportError("database_unavailable");
  return parseDocument(body);
};

const createNewState = async (): Promise<StateDocument> => {
  const response = await fetch("/api/state", {
    body: JSON.stringify({ action: "create_new" }),
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new StateTransportError("database_unavailable");
  }
  const error = readError(body);
  if (error) throw new StateTransportError(error.code);
  if (!response.ok) throw new StateTransportError("database_unavailable");
  return parseDocument(body);
};

const transport = {
  createNew: createNewState,
  load: () => requestState(),
  write: (request: StatePutRequest) => requestState(request),
};

export function SqliteStateController({ children }: { children: ReactNode }) {
  return (
    <StateRuntimeController mode="sqlite" transport={transport}>
      {children}
    </StateRuntimeController>
  );
}
