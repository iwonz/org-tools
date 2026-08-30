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

const readErrorCode = async (response: Response): Promise<StateApiErrorCode> => {
  try {
    const body = (await response.json()) as StateApiError;
    const code = body.error.code;
    if (
      code === "corrupt_stored_state" ||
      code === "database_unavailable" ||
      code === "invalid_input" ||
      code === "invalid_state"
    ) {
      return code;
    }
  } catch {
    // Unknown server output is deliberately collapsed to a local stable code.
  }
  return "database_unavailable";
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
  if (!response.ok) throw new StateTransportError(await readErrorCode(response));
  return parseDocument(await response.json());
};

const transport = {
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
