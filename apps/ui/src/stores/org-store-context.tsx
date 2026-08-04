"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";

import { OrgStore } from "@/stores/org-store";

const OrgStoreContext = createContext<OrgStore | null>(null);

export function OrgStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<OrgStore | null>(null);

  if (storeRef.current === null || typeof storeRef.current.removeExportSelection !== "function") {
    storeRef.current = new OrgStore();
  }

  return <OrgStoreContext.Provider value={storeRef.current}>{children}</OrgStoreContext.Provider>;
}

export const useOrgStore = () => {
  const store = useContext(OrgStoreContext);

  if (!store) {
    throw new Error("OrgStoreProvider is missing.");
  }

  return store;
};
