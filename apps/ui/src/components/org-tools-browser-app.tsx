"use client";

import { BrowserWorkspaceController } from "@/components/browser-workspace-controller";
import { OrgToolsWorkspace } from "@/components/org-tools-workspace";
import { OrgStoreProvider } from "@/stores/org-store-context";

export function OrgToolsBrowserApp() {
  return (
    <OrgStoreProvider>
      <BrowserWorkspaceController>
        <OrgToolsWorkspace />
      </BrowserWorkspaceController>
    </OrgStoreProvider>
  );
}
