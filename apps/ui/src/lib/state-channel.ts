import type { OrgToolsState } from "@org-tools/types";

import { parseOrgToolsState, parseOrgToolsUiState } from "@/lib/org-file";

export const STATE_CHANNEL_NAME = "org-tools-state";

export type StateStamp = {
  counter: number;
  originId: string;
};

export type StateChannelMessage =
  | { originId: string; type: "request" }
  | { stamp: StateStamp; state: OrgToolsState; type: "state" }
  | { stamp: StateStamp; type: "ui"; ui: OrgToolsState["ui"] };

export const compareStateStamps = (left: StateStamp, right: StateStamp): number =>
  left.counter === right.counter
    ? left.originId.localeCompare(right.originId, "en-US")
    : left.counter - right.counter;

export const nextStateStamp = (current: StateStamp, originId: string): StateStamp => ({
  counter: current.counter + 1,
  originId,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseStamp = (value: unknown): StateStamp => {
  if (
    !isRecord(value) ||
    Object.keys(value).length !== 2 ||
    !Number.isSafeInteger(value.counter) ||
    (value.counter as number) < 0 ||
    typeof value.originId !== "string" ||
    !value.originId
  ) {
    throw new Error("State synchronization stamp is invalid.");
  }
  return { counter: value.counter as number, originId: value.originId };
};

export const parseStateChannelMessage = (input: unknown): StateChannelMessage => {
  if (!isRecord(input) || typeof input.type !== "string") {
    throw new Error("State synchronization message is invalid.");
  }
  if (
    input.type === "request" &&
    Object.keys(input).sort().join("\0") === ["originId", "type"].sort().join("\0") &&
    typeof input.originId === "string" &&
    input.originId
  ) {
    return { originId: input.originId, type: "request" };
  }
  if (
    input.type === "state" &&
    Object.keys(input).sort().join("\0") === ["stamp", "state", "type"].sort().join("\0")
  ) {
    return {
      stamp: parseStamp(input.stamp),
      state: parseOrgToolsState(input.state),
      type: "state",
    };
  }
  if (
    input.type === "ui" &&
    Object.keys(input).sort().join("\0") === ["stamp", "type", "ui"].sort().join("\0")
  ) {
    return { stamp: parseStamp(input.stamp), type: "ui", ui: parseOrgToolsUiState(input.ui) };
  }
  throw new Error("State synchronization message shape is invalid.");
};
