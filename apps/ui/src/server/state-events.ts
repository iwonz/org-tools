export type StateRevisionSource = "mcp" | "ui";
export type StateRevisionEvent = { revision: number; source: StateRevisionSource };

type StateEventGlobal = typeof globalThis & {
  __orgToolsStateEventListeners?: Set<(event: StateRevisionEvent) => void>;
};

const listeners = () => {
  const shared = globalThis as StateEventGlobal;
  shared.__orgToolsStateEventListeners ??= new Set();
  return shared.__orgToolsStateEventListeners;
};

export const emitStateRevision = (event: StateRevisionEvent): void => {
  for (const listener of listeners()) listener(event);
};

export const subscribeToStateRevisions = (
  listener: (event: StateRevisionEvent) => void,
): (() => void) => {
  listeners().add(listener);
  return () => listeners().delete(listener);
};
