"use client";

import { createContext, useContext } from "react";

export type StateRuntimeMode = "browser" | "sqlite";

export type StateRuntimeContextValue = {
  error: "corrupt_stored_state" | "database_unavailable" | "invalid_state" | null;
  mode: StateRuntimeMode;
  pending: boolean;
  retry: () => void;
};

export const StateRuntimeContext = createContext<StateRuntimeContextValue | null>(null);

export const useStateRuntime = () => {
  const value = useContext(StateRuntimeContext);
  if (!value) throw new Error("StateRuntimeController is missing.");
  return value;
};
