"use client";

import { BrowserStateController } from "@/components/browser-state-controller";
import { OrgToolsShell } from "@/components/org-tools-shell";
import { OrgStoreProvider } from "@/stores/org-store-context";

export function OrgToolsBrowserApp() {
  return (
    <OrgStoreProvider>
      <BrowserStateController>
        <OrgToolsShell />
      </BrowserStateController>
    </OrgStoreProvider>
  );
}
