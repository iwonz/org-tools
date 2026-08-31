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
  readonly currentRevision: number | undefined;

  constructor(code: StateApiErrorCode, currentRevision?: number) {
    super(code);
    this.name = "StateTransportError";
    this.code = code;
    this.currentRevision = currentRevision;
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

const readError = (
  input: unknown,
): { code: StateApiErrorCode; currentRevision?: number } | null => {
  if (typeof input !== "object" || input === null || !("error" in input)) return null;
  try {
    const body = input as StateApiError;
    const code = body.error.code;
    if (
      code === "corrupt_stored_state" ||
      code === "database_unavailable" ||
      code === "invalid_input" ||
      code === "invalid_state" ||
      code === "revision_conflict"
    ) {
      const currentRevision =
        Number.isSafeInteger(body.error.currentRevision) &&
        (body.error.currentRevision as number) >= 1
          ? body.error.currentRevision
          : undefined;
      return currentRevision === undefined ? { code } : { code, currentRevision };
    }
  } catch {
    // Unknown server output is deliberately ignored and collapsed below.
  }
  return null;
};

let expectedRevision = 1;

const requestState = async (request?: StatePutRequest): Promise<StateDocument> => {
  const response = await fetch(
    "/api/state",
    request
      ? {
          body: JSON.stringify({ ...request, expectedRevision }),
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
    throw new StateTransportError(error.code, error.currentRevision);
  }
  if (!response.ok) throw new StateTransportError("database_unavailable");
  const document = parseDocument(body);
  expectedRevision = document.revision;
  return document;
};

const transport = {
  load: () => requestState(),
  subscribe: (listener: (event: { revision: number; source: "mcp" | "ui" }) => void) => {
    const source = new EventSource("/api/state/events");
    source.addEventListener("revision", (event) => {
      try {
        const value = JSON.parse((event as MessageEvent<string>).data) as unknown;
        if (
          typeof value === "object" &&
          value !== null &&
          "revision" in value &&
          Number.isSafeInteger(value.revision) &&
          "source" in value &&
          (value.source === "mcp" || value.source === "ui")
        ) {
          listener({ revision: value.revision as number, source: value.source });
        }
      } catch {
        // Invalid local event payloads are ignored; the next write still performs revision checks.
      }
    });
    return () => source.close();
  },
  write: (request: StatePutRequest) => requestState(request),
};

export function SqliteStateController({ children }: { children: ReactNode }) {
  return (
    <StateRuntimeController mode="sqlite" transport={transport}>
      {children}
    </StateRuntimeController>
  );
}
