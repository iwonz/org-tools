"use client";

import { McpControl } from "@/components/mcp-control";
import { OrgToolsShell } from "@/components/org-tools-shell";
import { SqliteStateController } from "@/components/sqlite-state-controller";
import { OrgStoreProvider } from "@/stores/org-store-context";

function StateApp() {
  return (
    <SqliteStateController>
      <OrgToolsShell serverSidebarAction={<McpControl />} />
    </SqliteStateController>
  );
}

export function OrgToolsApp() {
  return (
    <OrgStoreProvider>
      <StateApp />
    </OrgStoreProvider>
  );
}
